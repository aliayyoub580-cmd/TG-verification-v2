import React, { useState, useEffect } from 'react';
import { FiX, FiChevronRight, FiDownload, FiShare } from 'react-icons/fi';

/**
 * AppStoreIcon
 * Apple App Store 'A' compass logo
 */
function AppStoreIcon({ size = 20, bg = '#8e8e93', style = {} }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      style={{ verticalAlign: 'middle', display: 'inline-block', flexShrink: 0, ...style }}
    >
      <rect width="24" height="24" rx="5.5" fill={bg} />
      <path
        d="M12 4.5L7.2 16.5M12 4.5L16.8 16.5M6 14H18"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ProductAuthPopup
 * iOS App Clip bottom sheet matching Screenshot.PNG with Image.jpg banner, App Icon.png footer,
 * and PWA install / open scanner actions.
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

  const handleInstall = async () => {
    if (isStandalone) {
      alert('Application is already installed on your device.');
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
      setShowIosTip(true);
    }
  };

  return (
    <>
      {/* Dark Translucent Backdrop */}
      <div
        className={`appclip-scrim ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal Container */}
      <div className="appclip-sheet-wrap">
        <div
          className={`appclip-sheet popup-clip-sheet ${isOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Product Authenticity Verification Card"
        >
          {/* Top Graphic Banner with Image.jpg and Floating Close (X) Button */}
          <div className="popup-hero-banner-container">
            <img
              src="/PopUp/Image.jpg"
              alt="Valida la autenticidad de tu producto"
              className="popup-hero-banner-img"
              onError={(e) => {
                e.currentTarget.src = '/T.G.%2020mg.png';
              }}
            />

            {/* Floating Round Close Button matching Screenshot.PNG */}
            <button
              type="button"
              className="popup-floating-close-btn"
              onClick={onClose}
              aria-label="Close verification card"
              title="Close"
              id="close-popup-btn"
            >
              <FiX />
            </button>
          </div>

          {/* iOS / Browser Install Instructions Tooltip */}
          {showIosTip && (
            <div className="popup-install-tooltip">
              <div className="popup-tooltip-content">
                <FiShare className="popup-tooltip-icon" />
                <span>
                  To install: tap the browser <strong>Share</strong> button and select <strong>"Add to Home Screen"</strong>.
                </span>
              </div>
              <button
                type="button"
                className="popup-tooltip-close"
                onClick={() => setShowIosTip(false)}
                aria-label="Close installation tip"
              >
                ×
              </button>
            </div>
          )}

          {/* Middle Action Row: "Authenticate now" + "Scan the product QR code" + Actions */}
          <div className="popup-action-row">
            <div className="popup-action-text">
              <h3 className="popup-title">
                {productInfo?.name ? `Authenticate ${productInfo.name}` : 'Authenticate now'}
              </h3>
              <p className="popup-subtitle">Scan the product QR code</p>
            </div>

            <div className="popup-actions-col">
              <button
                type="button"
                className="popup-open-btn"
                onClick={onOpenScanner}
                id="appclip-open-button"
              >
                Open
              </button>
              {!isStandalone && (
                <button
                  type="button"
                  className="popup-install-btn"
                  onClick={handleInstall}
                  id="appclip-install-button"
                  title="Install application to your home screen"
                >
                  <FiDownload style={{ fontSize: '11px', marginRight: '3px' }} />
                  Install application
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="popup-divider" />

          {/* Bottom Footer Row: Provided by AuthNow + App Icon + 4+ + App Store + Chevron */}
          <div className="popup-footer-row">
            <div className="popup-footer-left">
              {/* App Clip Icon using Untitled design.png */}
              <div className="popup-appclip-icon-wrap">
                <img
                  src="/Untitled%20design.png"
                  alt="AuthNow"
                  className="popup-footer-app-icon"
                />
              </div>

              <div className="popup-footer-text-col">
                <span className="popup-provided-by">Provided by:</span>
                <span className="popup-provider-name">AuthNow – Prod...</span>
              </div>
            </div>

            <div className="popup-footer-right">
              <span className="popup-age-badge">4+</span>
              <div className="popup-appstore-badge">
                <AppStoreIcon size={20} bg="#8e8e93" />
              </div>
              <FiChevronRight className="popup-chevron-icon" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
