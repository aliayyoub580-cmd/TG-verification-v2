import React from 'react';
import '../../styles/verify.css';

/**
 * ResultView Component
 * Restores and renders the exact original authentic verification design:
 * Indufar logo, product name & medicine info, authentic status banner,
 * 3D product box image, verification description, divider, and footer.
 */
export default function ResultView({
  result,
  scannedCode,
  onScanAnother,
  onDone,
}) {
  const isAuthentic = Boolean(result?.authentic || result?.status === 'authentic');
  const isInactive = result?.status === 'inactive';

  const product = result?.data?.product || result?.product || {};
  const productName = product.name || result?.productName || 'T.G. 15 mg';
  const medicineName = product.medicineName || result?.medicineName || 'Tirzepatida';
  const dosage = product.dosage || result?.dosage || '15 mg/0.5mL';
  const code = result?.code || result?.serialNumber || scannedCode || '';
  const productImageUrl = product.imageUrl || result?.imageUrl || '/T.G.%2020mg.png';
  const logoUrl = product.logoUrl || result?.logoUrl || '/logo.png';
  const companyName = product.companyName || result?.companyName || result?.manufacturer || 'Indufar';
  const successMessage =
    product.successMessage ||
    result?.successMessage ||
    result?.message ||
    "This code matches our records. Compare it with the code printed on your product's packaging.";
  const footerText =
    product.footerText ||
    result?.footerText ||
    'Secured verification · Powered by Indufar';

  const handleImageFallback = (fallback) => (event) => {
    if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
  };

  return (
    <div
      className="verify-page"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: '#ffffff',
        overflowY: 'auto',
      }}
      role="region"
      aria-label="Verification Result"
    >
      <div
        className="verify-container"
        style={{
          minHeight: '100%',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {isAuthentic ? (
            <>
              {/* Logo */}
              <div className="verify-logo-wrap">
                <img src={logoUrl} alt={companyName} className="verify-logo" />
              </div>

              {/* Product name */}
              <p className="verify-product-name">{productName}</p>
              {(medicineName || dosage) && (
                <p className="verify-medicine-name">
                  {medicineName} {dosage}
                </p>
              )}

              {/* Success banner */}
              <div className="verify-banner verify-banner--authentic">
                <div className="verify-check-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="verify-status-title">Authentic Product</p>
                  <p className="verify-code-display">{code?.toUpperCase()}</p>
                </div>
              </div>

              {/* Product image */}
              <div className="verify-product-image-wrap">
                <img
                  src={productImageUrl}
                  onError={handleImageFallback('/T.G.%2020mg.png')}
                  alt={productName}
                  className="verify-product-image"
                />
              </div>

              {/* Description */}
              <p className="verify-description">{successMessage}</p>

              <hr className="verify-divider" />
              <p className="verify-footer">{footerText}</p>
            </>
          ) : isInactive ? (
            <>
              <div className="verify-logo-wrap">
                <img src={logoUrl} alt={companyName} className="verify-logo" />
              </div>
              <div className="verify-banner verify-banner--inactive">
                <div className="verify-warn-circle verify-warn-circle--amber">⚠</div>
                <div>
                  <p className="verify-status-title">Code Inactive</p>
                  <p className="verify-code-display">{code?.toUpperCase()}</p>
                </div>
              </div>
              <p className="verify-description">
                {result?.message ||
                  'This code exists but is currently inactive. It may have been recalled or deactivated. Please contact the seller for assistance.'}
              </p>
              <hr className="verify-divider" />
              <p className="verify-footer">{footerText}</p>
            </>
          ) : (
            <>
              <div className="verify-logo-wrap">
                <img src={logoUrl} alt={companyName} className="verify-logo" />
              </div>
              <div className="verify-banner verify-banner--notfound">
                <div className="verify-warn-circle verify-warn-circle--red">✕</div>
                <div>
                  <p className="verify-status-title">Not Verified</p>
                  {code && <p className="verify-code-display">{code?.toUpperCase()}</p>}
                </div>
              </div>
              <p className="verify-description">
                {result?.message ||
                  'This code does not match our official records. Please verify the code printed on the packaging or contact the seller.'}
              </p>
              <hr className="verify-divider" />
              <p className="verify-footer">{footerText}</p>
            </>
          )}
        </div>

        {/* Action buttons allowing user to scan another code or return */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '16px',
            marginBottom: '16px',
            paddingTop: '6px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onScanAnother}
            id="result-scan-another-btn"
            style={{
              flex: 1,
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              transition: 'background 0.15s ease',
            }}
          >
            Scan Another
          </button>
          <button
            type="button"
            onClick={onDone}
            id="result-done-btn"
            style={{
              flex: 1,
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '12px 14px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
