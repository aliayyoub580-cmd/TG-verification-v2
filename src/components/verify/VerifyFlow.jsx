import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductAuthPopup from './ProductAuthPopup.jsx';
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
  const urlCode = searchParams.get('code');
  const urlSku = searchParams.get('sku');

  // State machine: 'idle' | 'popup' | 'scanning' | 'result'
  const [flowState, setFlowState] = useState('idle');
  const [isValidating, setIsValidating] = useState(false);
  const [scannedCode, setScannedCode] = useState(urlCode || '');
  const [verificationResult, setVerificationResult] = useState(null);

  // Animate popup on initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setFlowState('popup');
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  // Handler: User taps "Open" on the bottom sheet
  const handleOpenScanner = () => {
    setFlowState('scanning');
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
  } catch (e) {}

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
          <h1 className="landing-preview-title">Indufar Verification</h1>
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
