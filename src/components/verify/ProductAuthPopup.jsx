import React from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { RiShieldCheckFill } from 'react-icons/ri';

/**
 * ProductAuthPopup
 * Replicates the half-screen iOS App Clip bottom-sheet popup card
 */
export default function ProductAuthPopup({
  isOpen,
  onClose,
  onOpenScanner,
  productInfo = null,
}) {
  return (
    <>
      {/* Dark Translucent Scrim */}
      <div
        className={`appclip-scrim ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Container */}
      <div className="appclip-sheet-wrap">
        <div
          className={`appclip-sheet ${isOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Product Authenticity Verification Card"
        >
          {/* iOS Handle Indicator */}
          <div className="appclip-drag-indicator" />

          {/* Top Bar: Client Logo + Close (X) */}
          <div className="appclip-sheet-header">
            <div className="sheet-brand-logo">
              <img
                src="/logo.png"
                alt="Indufar"
                className="sheet-brand-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextSibling;
                  if (fb) fb.style.display = 'inline-block';
                }}
              />
              <span className="sheet-brand-fallback" style={{ display: 'none' }}>
                INDUFAR
              </span>
            </div>

            <button
              type="button"
              className="sheet-close-btn"
              onClick={onClose}
              aria-label="Close verification card"
              title="Close"
            >
              <FiX />
            </button>
          </div>

          {/* Hero Banner Section with Mustard Accent Stripe */}
          <div className="sheet-hero-banner">
            <div className="sheet-banner-stripe" />
            <div className="sheet-banner-content">
              {/* Product / Facility Watermark Graphic */}
              <img
                src="/T.G.%2020mg.png"
                alt="Product Watermark"
                className="sheet-banner-graphic"
                onError={(e) => {
                  e.currentTarget.src = '/favicon.svg';
                }}
              />

              {/* Bold Headline in 2-3 lines & colors */}
              <h2 className="sheet-headline">
                VALIDA LA
                <span className="accent">AUTENTICIDAD</span>
                DE TU PRODUCTO
              </h2>

              {/* Two Feature Rows with Icons */}
              <div className="sheet-feature-list">
                <div className="sheet-feature-item">
                  <div className="feature-icon-circle">
                    <FiCheck />
                  </div>
                  <span className="feature-text">
                    Verifica que tu producto es auténtico y original
                  </span>
                </div>

                <div className="sheet-feature-item">
                  <div className="feature-icon-circle qr">
                    <MdQrCodeScanner />
                  </div>
                  <span className="feature-text">
                    Escanea y verifica la autenticidad de tu producto
                  </span>
                </div>
              </div>

              {/* App Badge/Logo ("AuthNow" style: shield-check + wordmark) */}
              <div className="sheet-authnow-badge">
                <RiShieldCheckFill className="authnow-badge-icon" />
                <span className="authnow-badge-text">AuthNow</span>
              </div>
            </div>
          </div>

          {/* Below Banner: Title, Subtitle, and Pill "Open" Button */}
          <div className="sheet-action-row">
            <div className="sheet-action-info">
              <h3 className="sheet-action-title">Autentica ahora</h3>
              <p className="sheet-action-sub">
                {productInfo?.name ? `Producto: ${productInfo.name}` : 'Escanee el QR del producto'}
              </p>
            </div>

            <button
              type="button"
              className="sheet-open-btn"
              onClick={onOpenScanner}
              id="appclip-open-button"
            >
              Open
            </button>
          </div>

          {/* Normal In-Page Footer Row */}
          <div className="sheet-footer-row">
            <RiShieldCheckFill className="sheet-footer-icon" />
            <span className="sheet-footer-text">
              Powered by <strong>AuthNow – Product Verification</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
