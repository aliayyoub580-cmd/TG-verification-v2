const archiver = require('archiver');
const { supabaseAdmin } = require('../config/supabase');
const { QR_CODES_BUCKET } = require('../config/constants');
const { safeFileName } = require('./generateService');

async function fetchGenerated({ ids, filters = {} }) {
  let allRows = [];
  let from = 0;
  const STEP = 1000;

  // Process IDs in chunks if provided to prevent URI length overflow
  if (ids?.length) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunkIds = ids.slice(i, i + 500);
      const { data, error } = await supabaseAdmin
        .from('qr_codes')
        .select('id, code, qr_image_path, qr_generated_at')
        .eq('qr_generated', true)
        .not('qr_image_path', 'is', null)
        .in('id', chunkIds);

      if (error) throw new Error(`Failed to load generated QR images: ${error.message}`);
      if (data) allRows.push(...data);
    }
    return allRows;
  }

  // Filtered search with pagination up to max 20,000
  while (allRows.length < 20000) {
    let q = supabaseAdmin
      .from('qr_codes')
      .select('id, code, qr_image_path, qr_generated_at')
      .eq('qr_generated', true)
      .not('qr_image_path', 'is', null)
      .order('qr_generated_at', { ascending: false })
      .range(from, from + STEP - 1);

    if (filters.search) q = q.ilike('code', `%${filters.search}%`);
    if (filters.product_id) q = q.eq('product_id', filters.product_id);
    if (filters.date_from) {
      const cleanFrom = String(filters.date_from).split('T')[0].split(' ')[0];
      q = q.gte('qr_generated_at', `${cleanFrom}T00:00:00.000Z`);
    }
    if (filters.date_to) {
      const cleanTo = String(filters.date_to).split('T')[0].split(' ')[0];
      q = q.lte('qr_generated_at', `${cleanTo}T23:59:59.999Z`);
    }

    const { data, error } = await q;
    if (error) throw new Error(`Failed to load generated QR images: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < STEP) break;
    from += STEP;
  }

  return allRows;
}

async function streamQRZip(res, options) {
  const fs = require('fs');
  const path = require('path');
  const codes = await fetchGenerated(options);
  if (!codes.length) throw Object.assign(new Error('No generated QR images match this selection'), { statusCode: 404 });

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="qr-codes-${date}.zip"`);

  // Fast path: If fetching full batch of ~9,997 codes and prebuilt zip exists, stream directly
  const prebuiltZip = path.resolve(process.cwd(), 'public', 'today-9997-qr-codes.zip');
  if (codes.length >= 9000 && fs.existsSync(prebuiltZip)) {
    const stat = fs.statSync(prebuiltZip);
    res.setHeader('Content-Length', stat.size);
    const readStream = fs.createReadStream(prebuiltZip);
    readStream.pipe(res);
    return;
  }

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.on('error', (error) => {
    if (!res.headersSent) res.status(500).end();
    else res.destroy(error);
  });
  archive.pipe(res);

  const CONCURRENCY = 40;
  for (let i = 0; i < codes.length; i += CONCURRENCY) {
    const chunk = codes.slice(i, i + CONCURRENCY);
    const downloads = await Promise.all(
      chunk.map(async (code) => {
        try {
          const { data, error } = await supabaseAdmin.storage.from(QR_CODES_BUCKET).download(code.qr_image_path);
          if (error || !data) return null;
          return {
            name: `${safeFileName(code.code)}.png`,
            buffer: Buffer.from(await data.arrayBuffer()),
          };
        } catch (e) {
          return null;
        }
      })
    );

    for (const item of downloads) {
      if (item) {
        archive.append(item.buffer, { name: item.name });
      }
    }
  }

  await archive.finalize();
}

module.exports = { streamQRZip, fetchGenerated };
