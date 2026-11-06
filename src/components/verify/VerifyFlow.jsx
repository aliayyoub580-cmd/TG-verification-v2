import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ProductAuthPopup from './ProductAuthPopup.jsx';
import OnboardingInstructions from './OnboardingInstructions.jsx';
import IosSpinner from './IosSpinner.jsx';
import ScannerView from './ScannerView.jsx';
import ResultView from './ResultView.jsx';
import { verifyAPI } from '../../services/api.js';
import { RiShieldCheckFill } from 'react-icons/ri';
import { FiCheckCircle } from 'react-icons/fi';
import '../../styles/app-clip.css';

/**
 * VerifyFlow
 * Master state machine managing the iOS App Clip experience:
 * idle -> popup -> scanning -> result
 */
export default function VerifyFlow() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const urlCode = searchParams.get('code');
  const urlSku = searchParams.get('sku');
  const isDirectScan =
    location.pathname.includes('/scan') ||
    searchParams.get('mode') === 'scan' ||
    searchParams.get('scan') === '1';

  // State machine: 'idle' | 'popup' | 'onboarding' | 'loading' | 'scanning' | 'result'
  const [flowState, setFlowState] = useState(isDirectScan ? 'scanning' : 'idle');
  const [isValidating, setIsValidating] = useState(false);
  const [scannedCode, setScannedCode] = useState(urlCode || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const loadingTimerRef = useRef(null);

  // Clean up loading timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Animate popup on initial page load if not on direct scan
  useEffect(() => {
    if (isDirectScan) {
      setFlowState('scanning');
      return;
    }
    const timer = setTimeout(() => {
      setFlowState('popup');
    }, 180);
    return () => clearTimeout(timer);
  }, [isDirectScan]);

  // Handler: User taps "Open" on the bottom sheet -> always show onboarding popup
  const handleOpenScanner = () => {
    setFlowState('onboarding');
  };

  // Handler: User finishes onboarding and taps "Authenticate" -> show loading screen for 1s
  const handleStartScanning = () => {
    // Synchronously request camera access within the direct user tap gesture.
    // This establishes trusted User Activation in iOS Safari WebKit,
    // allowing iOS to save the permission permanently for all next times!
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
        .then((stream) => {
          try {
            localStorage.setItem('tg_camera_permission_granted', 'true');
          } catch (e) {
            // ignore
          }
          // Temporarily hold stream so ScannerView attaches cleanly
          window.__indufarPrewarmedStream = stream;
        })
        .catch((err) => {
          console.warn('Pre-warming camera permission on user gesture:', err);
        });
    }

    setFlowState('loading');
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setFlowState('scanning');
    }, 1000);
  };

  // Handler: User dismisses bottom sheet with X or scrim click
  const handleClosePopup = () => {
    setFlowState('idle');
  };

  // Handler: User cancels / stops scanning
  const handleCancelScanner = () => {
    setFlowState('popup');
  };

  /**
   * Helper to extract code parameter if raw scan string is a URL
   */
  function extractVerificationCode(input) {
    if (!input) return '';
    let str = String(input).trim();
    try {
      if (str.startsWith('http://') || str.startsWith('https://')) {
        const parsed = new URL(str);
        const paramCode = parsed.searchParams.get('code');
        if (paramCode) return paramCode.trim();
      }
    } catch (e) {
      // Ignore URL parse error and fallback to regex
    }

    const match = str.match(/[?&]code=([^&#\s]+)/i);
    if (match) {
      try {
        return decodeURIComponent(match[1]).trim();
      } catch (e) {
        return match[1].trim();
      }
    }
    return str;
  }

  // Handler: Code successfully scanned or entered
  const handleScanSuccess = async (rawScannedCode) => {
    if (!rawScannedCode) return;
    const cleanCode = extractVerificationCode(rawScannedCode);
    setScannedCode(cleanCode);
    setIsValidating(true);

    try {
      // Call backend POST /api/verify with cleanCode
      const res = await verifyAPI.verifyPost(cleanCode);
      const data = res.data;

      // Brief delay for smooth animation transition
      setTimeout(() => {
        setVerificationResult(data);
        setIsValidating(false);
        setFlowState('result');
      }, 500);
    } catch (err) {
      console.error('Verification error:', err);
      const errData = err.response?.data;
      setTimeout(() => {
        setVerificationResult({
          authentic: false,
          serialNumber: cleanCode,
          message:
            errData?.message ||
            'Verification service temporarily unavailable or code invalid. Please try again.',
        });
        setIsValidating(false);
        setFlowState('result');
      }, 500);
    }
  };

  // Handler: User wants to scan another item from result screen
  const handleScanAnother = () => {
    setScannedCode('');
    setVerificationResult(null);
    setFlowState('scanning');
  };

  // Handler: User taps "Done" on result screen
  const handleDone = () => {
    setFlowState('popup');
  };

  return (
    <div className="appclip-canvas">
      {/* ── Simulated Native Environment / Landing Backdrop ── */}
      <div className="appclip-landing-backdrop">
        <div className="landing-preview-box">
          <div className="landing-preview-icon">
            <RiShieldCheckFill />
          </div>
          <h1 className="landing-preview-title">Autentica ahora</h1>
          <p className="landing-preview-desc">
            {urlCode
              ? `Verification request for product code: ${urlCode}`
              : 'Scan the security code or barcode printed on your product packaging to verify authenticity.'}
          </p>

          {/* Quick trigger button if user dismissed the popup card */}
          {flowState === 'idle' && (
            <button
              type="button"
              className="landing-trigger-btn"
              onClick={() => setFlowState('popup')}
              id="reopen-card-btn"
            >
              <FiCheckCircle /> Verify Product
            </button>
          )}
        </div>
      </div>

      {/* ── 1. Half-Screen Popup Card (iOS App Clip Bottom Sheet) ── */}
      <ProductAuthPopup
        isOpen={flowState === 'popup'}
        onClose={handleClosePopup}
        onOpenScanner={handleOpenScanner}
        productInfo={urlSku ? { name: urlSku } : null}
      />

      {/* ── 1.5. Onboarding Instructions Step Modal ── */}
      {flowState === 'onboarding' && (
        <div className="onboarding-flow-container">
          {/* Render the scanner view in background preview mode or ambient backdrop */}
          <div className="onboarding-ambient-bg" aria-hidden="true">
            <header className="authnow-top-bar">
              <div className="authnow-menu-button">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="#2e2a72" strokeWidth="2.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="scanner-indufar-brand-wrap">
                <img
                  src="/logo.png"
                  alt="INDUFAR"
                  className="scanner-indufar-logo-img"
                />
              </div>
              <div className="authnow-top-spacer" />
            </header>
            <div className="authnow-viewfinder-section">
              <div className="authnow-viewfinder-frame">
                <div className="scanner-scan-window" aria-hidden="true">
                  <span className="reticle-corner top-left" />
                  <span className="reticle-corner top-right" />
                  <span className="reticle-corner bottom-left" />
                  <span className="reticle-corner bottom-right" />
                </div>
                <div className="scanner-focus-strip" aria-hidden="true">
                  <span className="scanner-focus-text">Focus the QR code</span>
                </div>
              </div>
            </div>
          </div>

          <OnboardingInstructions onStartScan={handleStartScanning} />
        </div>
      )}

      {/* ── 1.8. Full-Screen Loading Screen (1s on Authenticate click) ── */}
      {flowState === 'loading' && (
        <div className="authnow-fullscreen-loading" role="status" aria-label="Loading scanner">
          <IosSpinner size={42} />
        </div>
      )}

      {/* ── 2. Full-Screen Camera Scanner Screen ── */}
      {flowState === 'scanning' && (
        <ScannerView
          onScanSuccess={handleScanSuccess}
          onCancel={handleCancelScanner}
          isValidating={isValidating}
        />
      )}

      {/* ── 3. Verification Result Screen ── */}
      {flowState === 'result' && (
        <ResultView
          result={verificationResult}
          scannedCode={scannedCode}
          onScanAnother={handleScanAnother}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
