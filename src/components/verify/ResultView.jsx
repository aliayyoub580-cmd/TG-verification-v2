import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { RiShieldCheckFill } from 'react-icons/ri';

/**
 * ResultView Component
 * Renders the verification outcome (Authentic vs Not Authentic / Counterfeit)
 */
export default function ResultView({
  result,
  scannedCode,
  onScanAnother,
  onDone,
}) {
  const isAuthentic = Boolean(result?.authentic);

  return (
    <div className="appclip-result-view" role="region" aria-label="Verification Result">
      <div className="result-content-wrap">
        {/* Hero Status Icon */}
        <div
          className={`result-hero-icon ${isAuthentic ? 'authentic' : 'counterfeit'}`}
        >
          {isAuthentic ? <FiCheckCircle /> : <FiAlertTriangle />}
        </div>

        {/* Headline */}
        <h2 className={`result-title ${isAuthentic ? 'authentic' : 'counterfeit'}`}>
          {isAuthentic ? 'This product is authentic' : 'This product could not be verified'}
        </h2>

        {/* Subtitle */}
        <p className="result-subtitle">
          {isAuthentic
            ? 'Official Indufar product verified with valid cryptographic security certificate.'
            : 'The scanned code did not match our registered batch records or may be counterfeit.'}
        </p>

        {/* Product Details Card */}
        <div className="result-details-card">
          <div className="result-details-header">
            <span className="result-brand-pill">{result?.brand || 'INDUFAR'}</span>
            <div className="result-status-badge">
              {isAuthentic ? (
                <>
                  <RiShieldCheckFill style={{ fontSize: '15px' }} />
                  <span>VERIFIED ORIGINAL</span>
                </>
              ) : (
                <span style={{ color: '#dc2626' }}>UNVERIFIED</span>
              )}
            </div>
          </div>

          {/* Product Name */}
          <h3 className="result-product-name">
            {result?.productName || (isAuthentic ? 'T.G. 20 mg (Tadalafil)' : 'Unknown Product')}
          </h3>

          {/* Key Attribute Grid */}
          <div className="result-info-grid">
            <div className="result-info-item">
              <span className="result-info-label">Code / Serial</span>
              <span className="result-info-value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                {result?.serialNumber || scannedCode || 'N/A'}
              </span>
            </div>

            <div className="result-info-item">
              <span className="result-info-label">Batch / Lote</span>
              <span className="result-info-value">
                {result?.batch || (isAuthentic ? 'B-2024-08X' : 'Not registered')}
              </span>
            </div>

            {result?.dosage && (
              <div className="result-info-item">
                <span className="result-info-label">Dosage</span>
                <span className="result-info-value">{result.dosage}</span>
              </div>
            )}

            {result?.expiryDate && (
              <div className="result-info-item">
                <span className="result-info-label">Expiry Date</span>
                <span className="result-info-value">{result.expiryDate}</span>
              </div>
            )}

            <div className="result-info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="result-info-label">Manufacturer</span>
              <span className="result-info-value">
                {result?.manufacturer || 'Laboratorios Indufar C.A.'}
              </span>
            </div>
          </div>

          {/* Result Message Box */}
          {isAuthentic ? (
            <div className="result-verified-message">
              {result?.message ||
                'This code matches our official registry. Compare it with the code printed on your product packaging.'}
            </div>
          ) : (
            <div className="result-warning-message">
              {result?.message ||
                'Warning: This product cannot be verified. If you suspect tampering or counterfeiting, do not consume it and report it to Indufar customer service immediately.'}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
          <FiShield style={{ color: isAuthentic ? '#10b981' : '#f59e0b' }} />
          <span>
            {isAuthentic
              ? 'Secured Anti-Counterfeit Verification · AuthNow v2.0'
              : 'Contact Support: soporte@indufar.com · Phone: +595 21 000 000'}
          </span>
        </div>
      </div>

      {/* Bottom Pinned Actions */}
      <div className="result-bottom-bar">
        <button
          type="button"
          className="result-action-primary"
          onClick={onScanAnother}
          id="result-scan-another-btn"
        >
          Scan Another Product
        </button>

        <button
          type="button"
          className="result-action-secondary"
          onClick={onDone}
          id="result-done-btn"
        >
          Done
        </button>
      </div>
    </div>
  );
}
