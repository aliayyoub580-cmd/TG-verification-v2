import React, { useEffect, useState } from 'react';
import { qrAPI, productsAPI } from '../../services/api.js';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import { fmt, fmtDate } from '../../utils/download.js';
import toast from 'react-hot-toast';

export default function GeneratePage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    product_id: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 25,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [customCount, setCustomCount] = useState(1000);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [singleDeleting, setSingleDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await qrAPI.pending(filters);
      setRows(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load pending codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    productsAPI.list({ limit: 200 }).then(({ data }) => setProducts(data.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [filters.page, filters.limit, filters.product_id, filters.date_from, filters.date_to]);

  // Select first N codes (1 to 10,000 or up to total)
  const selectNCodes = async (count) => {
    if (!total) return;
    const targetCount = Math.min(10000, Math.max(1, parseInt(count, 10) || 1));
    const tid = toast.loading(`Selecting top ${fmt(targetCount)} code(s)...`);
    try {
      const { data } = await qrAPI.pending({
        ...filters,
        all: 'true',
        limit: targetCount,
      });
      const ids = (data.data || []).map((r) => r.id);
      setSelected(new Set(ids));
      toast.success(`Selected ${fmt(ids.length)} code(s)`, { id: tid });
    } catch (e) {
      toast.error('Could not select codes', { id: tid });
    }
  };

  // Select all filtered codes
  const selectAllFiltered = async () => {
    if (!total) return;
    const tid = toast.loading(`Selecting filtered code(s)...`);
    try {
      const { data } = await qrAPI.pending({ ...filters, all: 'true' });
      const ids = (data.data || []).map((r) => r.id);
      setSelected(new Set(ids));
      toast.success(`Selected ${fmt(ids.length)} filtered code(s)`, { id: tid });
    } catch (e) {
      toast.error('Could not select filtered codes', { id: tid });
    }
  };

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const pageIds = rows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const togglePageAll = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPage) {
        pageIds.forEach((id) => n.delete(id));
      } else {
        pageIds.forEach((id) => n.add(id));
      }
      return n;
    });
  };

  // Generate selected QR codes in batches of 100
  const runGenerate = async (idsToGenerate) => {
    if (!idsToGenerate.length || processing) return;
    setProcessing(true);
    const totalToGen = idsToGenerate.length;
    const CHUNK_SIZE = 100;
    let generatedCount = 0;
    let failedCount = 0;
    const tid = toast.loading(`Generating QR code 0 / ${fmt(totalToGen)}...`);

    try {
      for (let i = 0; i < idsToGenerate.length; i += CHUNK_SIZE) {
        const chunk = idsToGenerate.slice(i, i + CHUNK_SIZE);
        const currentEnd = Math.min(i + CHUNK_SIZE, totalToGen);
        toast.loading(`Generating QR codes: ${fmt(currentEnd)} / ${fmt(totalToGen)}...`, { id: tid });
        const activeOrigin = window.location.origin.includes('localhost')
          ? 'https://tg-verification-v2.vercel.app'
          : window.location.origin.replace('tg-verification-xi.vercel.app', 'tg-verification-v2.vercel.app');
        const { data } = await qrAPI.generate(chunk, activeOrigin);
        const resData = data?.data || {};
        generatedCount += resData.generated || 0;
        failedCount += resData.failed || 0;
      }

      if (failedCount > 0) {
        toast.error(`Generated ${fmt(generatedCount)}; ${fmt(failedCount)} failed`, { id: tid, duration: 6000 });
      } else {
        toast.success(`Successfully generated ${fmt(generatedCount)} QR code(s)`, { id: tid });
      }
      setSelected(new Set());
      await load();
    } catch (e) {
      const detail = e.response?.data?.message || 'QR generation failed';
      toast.error(detail, { id: tid, duration: 7000 });
    } finally {
      setProcessing(false);
    }
  };

  // Delete selected codes in batches of 500
  const runDeleteSelected = async () => {
    const idsToDelete = [...selected];
    if (!idsToDelete.length || processing) return;
    setShowDeleteModal(false);
    setProcessing(true);
    const totalToDelete = idsToDelete.length;
    const CHUNK_SIZE = 500;
    let deletedCount = 0;
    const tid = toast.loading(`Deleting 0 / ${fmt(totalToDelete)} code(s)...`);

    try {
      for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
        const currentEnd = Math.min(i + CHUNK_SIZE, totalToDelete);
        toast.loading(`Deleting codes: ${fmt(currentEnd)} / ${fmt(totalToDelete)}...`, { id: tid });
        const { data } = await qrAPI.bulkDelete(chunk);
        deletedCount += data?.deleted || chunk.length;
      }
      toast.success(`Successfully deleted ${fmt(deletedCount)} code(s)`, { id: tid });
      setSelected(new Set());
      await load();
    } catch (e) {
      const detail = e.response?.data?.message || 'Bulk delete failed';
      toast.error(detail, { id: tid, duration: 7000 });
    } finally {
      setProcessing(false);
    }
  };

  // Single item delete
  const runSingleDelete = async (id, codeStr) => {
    if (!window.confirm(`Are you sure you want to delete code "${codeStr}"?`)) return;
    setSingleDeleting(id);
    const tid = toast.loading(`Deleting code...`);
    try {
      await qrAPI.bulkDelete([id]);
      toast.success(`Deleted code ${codeStr}`, { id: tid });
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed', { id: tid });
    } finally {
      setSingleDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate QR Codes</h1>
          <p className="page-subtitle">
            Generate PNG images or delete imported client codes ({fmt(total)} pending)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {selected.size > 0 && (
            <>
              <Button
                variant="danger"
                disabled={processing}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Selected ({fmt(selected.size)})
              </Button>
              <Button
                variant="primary"
                disabled={processing}
                loading={processing}
                onClick={() => runGenerate([...selected])}
              >
                Generate Selected ({fmt(selected.size)})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Selection Toolbar (1 to 10,000 Codes) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                Select Codes:
              </span>
              {[100, 500, 1000, 5000, 10000].map((num) => (
                <Button
                  key={num}
                  size="sm"
                  variant="outline"
                  disabled={!total || processing}
                  onClick={() => selectNCodes(num)}
                >
                  {fmt(num)}
                </Button>
              ))}

              {/* Custom count input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  className="form-control"
                  style={{ width: 100, padding: '4px 8px', height: 32, fontSize: 13 }}
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder="1-10000"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!total || processing || !customCount}
                  onClick={() => selectNCodes(customCount)}
                >
                  Select N
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={!total || processing}
                onClick={selectAllFiltered}
              >
                Select All Filtered ({fmt(total)})
              </Button>

              {selected.size > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={processing}
                  onClick={() => setSelected(new Set())}
                >
                  Clear Selection
                </Button>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {selected.size > 0 ? (
                <span className="badge badge--active" style={{ fontSize: 13, padding: '6px 12px' }}>
                  {fmt(selected.size)} code(s) selected
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>No codes selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="form-control"
              placeholder="Search code…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <select
              className="form-control form-select"
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value, page: 1 })}
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="form-control"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
            />
            <input
              type="date"
              className="form-control"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
            />

            <select
              className="form-control form-select"
              style={{ width: 130 }}
              value={filters.limit}
              onChange={(e) =>
                setFilters({ ...filters, limit: parseInt(e.target.value, 10), page: 1 })
              }
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={250}>250 / page</option>
              <option value={500}>500 / page</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({ ...filters, page: 1 });
                load();
              }}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={togglePageAll}
                  />
                </th>
                <th>Code</th>
                <th>Product</th>
                <th>Imported Date</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="td-code">{r.code}</td>
                  <td>{r.products?.name || '—'}</td>
                  <td>{fmtDate(r.imported_at)}</td>
                  <td>
                    <Badge label={r.status} type={r.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button
                        size="sm"
                        disabled={processing}
                        onClick={() => runGenerate([r.id])}
                      >
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={processing || singleDeleting === r.id}
                        onClick={() => runSingleDelete(r.id, r.code)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>
                    No imported codes are waiting for QR generation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={filters.page}
          totalPages={Math.ceil(total / filters.limit)}
          onPage={(page) => setFilters({ ...filters, page })}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: 'var(--text-primary)' }}>
              Confirm Bulk Deletion
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--danger)' }}>{fmt(selected.size)}</strong> selected pending
              code(s)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                disabled={processing}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={processing}
                disabled={processing}
                onClick={runDeleteSelected}
              >
                Yes, Delete {fmt(selected.size)} Code(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
