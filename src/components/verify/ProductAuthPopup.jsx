import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { RiShieldCheckFill } from 'react-icons/ri';

/**
 * ProductAuthPopup
 * PWA & App Clip card on the page with close (cross) button and app installation capability.
 */
export default function ProductAuthPopup({
  isOpen,
  onClose,
  onOpenScanner,
  productInfo = null,
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    ) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const isIos = () => {
    return (
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  };

  const handleInstallOrOpen = async () => {
    if (isStandalone) {
      onOpenScanner();
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      setDeferredPrompt(null);
    } else if (isIos()) {
      setShowIosTip(true);
    } else {
      onOpenScanner();
    }
  };

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

          {/* Top Bar: Client Logo + Close (X) Cross Button */}
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
                    {isStandalone
                      ? 'Escanea y verifica la autenticidad de tu producto'
                      : 'Instala la app para escanear y verificar tu producto'}
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

          {/* iOS Safari Home Screen instruction tooltip */}
          {showIosTip && (
            <div
              style={{
                margin: '12px 16px 0 16px',
                padding: '10px 14px',
                background: '#f1f5f9',
                borderRadius: '12px',
                fontSize: '12.5px',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                lineHeight: 1.4,
              }}
            >
              <span>
                Para instalar en iPhone: toca el botón Compartir (
                <svg
                  style={{ display: 'inline', verticalAlign: '-2px', width: '14px', height: '14px' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                ) y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
              </span>
              <button
                type="button"
                onClick={() => setShowIosTip(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#64748b',
                  marginLeft: '8px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Below Banner: Title, Subtitle, and Pill "Install" / "Open" Button */}
          <div className="sheet-action-row">
            <div className="sheet-action-info">
              <h3 className="sheet-action-title">
                {isStandalone ? 'Autentica ahora' : 'Instalar aplicación'}
              </h3>
              <p className="sheet-action-sub">
                {isStandalone
                  ? productInfo?.name
                    ? `Producto: ${productInfo.name}`
                    : 'Escanee el QR del producto'
                  : 'Instale la app para verificar la autenticidad'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px',
              }}
            >
              <button
                type="button"
                className="sheet-open-btn"
                onClick={handleInstallOrOpen}
                id="appclip-open-button"
              >
                {isStandalone ? 'Open' : 'Install'}
              </button>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 4px',
                  }}
                >
                  Continuar sin instalar
                </button>
              )}
            </div>
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
