import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  FiUploadCloud,
  FiEdit3,
  FiX,
  FiCameraOff,
  FiCheckCircle,
  FiAlertCircle,
  FiSun,
  FiMaximize2,
} from 'react-icons/fi';
import { Flashlight } from 'lucide-react';

const SCANNER_ELEMENT_ID = 'html5-qrcode-reader';

// Rotating guidance cues matching the AuthNow reference system
const GUIDANCE_LIST = [
  {
    pill: 'Analyzing QR',
    detail: 'Keep steady',
    tip: 'Ensure the entire QR code is visible inside the frame.',
  },
  {
    pill: 'Move back slowly',
    detail: 'Move back a little more',
    tip: 'Keep the phone 15–25 cm away so the camera can focus sharply.',
  },
  {
    pill: 'Hold steady',
    detail: 'Keep steady',
    tip: 'Avoid quick hand movements while the code is being read.',
  },
  {
    pill: 'Find good lighting',
    detail: 'Avoid reflections or heavy glare',
    tip: 'Use the flashlight toggle if scanning in dim lighting.',
  },
  {
    pill: 'Move closer slowly',
    detail: 'Bring camera slightly closer',
    tip: 'If the code is small on packaging, move in gradually.',
  },
];

/**
 * Pixel-perfect AuthNow Shield & Wordmark Logo Component
 */
function AuthNowLogo() {
  return (
    <div className="authnow-brand-header" aria-label="AuthNow">
      {/* Dual contour shield with checkmark */}
      <svg
        className="authnow-shield-svg"
        viewBox="0 0 52 52"
        width="46"
        height="46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer shield in mint/green */}
        <path
          d="M26 4L8 11.5V23.5C8 35.2 15.7 46 26 48.8C36.3 46 44 35.2 44 23.5V11.5L26 4Z"
          stroke="#4ade80"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* Inner shield contour in sky-cyan */}
        <path
          d="M26 8.5L12.5 14.5V23.5C12.5 32.5 18.2 41 26 43.5C33.8 41 39.5 32.5 39.5 23.5V14.5L26 8.5Z"
          stroke="#38bdf8"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.85"
        />
        {/* Inner green checkmark */}
        <path
          d="M18.5 25.5L23.5 30.5L33.5 19.5"
          stroke="#4ade80"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* AuthNow stacked wordmark */}
      <div className="authnow-text-block">
        <span className="authnow-auth">auth</span>
        <span className="authnow-now">
          no<span className="authnow-w-accent">w</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Flashlight / Torch Icon using lucide-react Flashlight
 */
function TorchIcon({ isOn }) {
  return (
    <Flashlight
      size={24}
      strokeWidth={2.2}
      color={isOn ? '#facc15' : '#ffffff'}
    />
  );
}

export default function ScannerView({
  onScanSuccess,
  onCancel,
  isValidating = false,
}) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [guidanceIndex, setGuidanceIndex] = useState(0);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStoppingRef = useRef(false);
  const [recognitionFailedModalOpen, setRecognitionFailedModalOpen] = useState(false);

  // Authenticate button click handler:
  // When user clicks the green "Authenticate" button on the scanner page:
  // If no product QR is in view/recognized, show "Product not recognized" modal.
  const handleAuthenticateClick = () => {
    setRecognitionFailedModalOpen(true);
  };

  // Rotate guidance tips periodically while scanning
  useEffect(() => {
    if (isValidating) return;
    const interval = setInterval(() => {
      setGuidanceIndex((prev) => (prev + 1) % GUIDANCE_LIST.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isValidating]);

  // Handle manual next guidance trigger (e.g. clicking guidance text)
  const handleCycleGuidance = () => {
    setGuidanceIndex((prev) => (prev + 1) % GUIDANCE_LIST.length);
  };

  // Safe camera stop helper
  const stopScannerSafe = useCallback(async (scannerInstance) => {
    const scanner = scannerInstance || html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        // Ignore stop errors if already stopping
      }
    }
  }, []);

  // Inspect track to check if torch/flashlight is supported
  const checkTorchCapability = useCallback((scanner) => {
    try {
      const videoElem = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        if (track && typeof track.getCapabilities === 'function') {
          const caps = track.getCapabilities();
          if (caps && caps.torch) {
            setTorchAvailable(true);
            return;
          }
        }
      }
      if (scanner && typeof scanner.getRunningTrackCameraCapabilities === 'function') {
        const caps = scanner.getRunningTrackCameraCapabilities();
        if (caps?.torchFeature()?.isSupported()) {
          setTorchAvailable(true);
        }
      }
    } catch (e) {
      setTorchAvailable(false);
    }
  }, []);

  // Toggle torch
  const toggleTorch = async () => {
    const newTorchState = !torchOn;
    try {
      const videoElem = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
      if (videoElem && videoElem.srcObject) {
        const track = videoElem.srcObject.getVideoTracks()[0];
        if (track && typeof track.applyConstraints === 'function') {
          await track.applyConstraints({
            advanced: [{ torch: newTorchState }],
          });
          setTorchOn(newTorchState);
          return;
        }
      }
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newTorchState }],
        });
        setTorchOn(newTorchState);
      }
    } catch (err) {
      console.warn('Torch toggle failed on this device:', err);
      setTorchOn(newTorchState); // visual toggle state feedback
    }
  };

  // Initialize and start scanner on mount
  useEffect(() => {
    isStoppingRef.current = false;

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.ITF,
    ];

    const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport,
      verbose: false,
    });
    html5QrCodeRef.current = html5QrCode;

    const qrCodeSuccessCallback = (decodedText) => {
      if (isStoppingRef.current) return;
      isStoppingRef.current = true;

      stopScannerSafe(html5QrCode).then(() => {
        onScanSuccess(decodedText);
      });
    };

    const qrCodeErrorCallback = () => {
      // Normal per-frame scan loop without match
    };

    const config = {
      fps: 20,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        return {
          width: Math.floor(viewfinderWidth * 0.9),
          height: Math.floor(viewfinderHeight * 0.9),
        };
      },
      aspectRatio: 1.25,
    };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      )
      .then(() => {
        setCameraReady(true);
        setCameraError(null);
        checkTorchCapability(html5QrCode);
      })
      .catch((err) => {
        console.warn('Camera start failed or permission denied:', err);
        setCameraReady(false);
        setCameraError(
          err?.message || 'Camera permission denied or camera not available.'
        );
      });

    return () => {
      isStoppingRef.current = true;
      stopScannerSafe(html5QrCode);
    };
  }, [onScanSuccess, stopScannerSafe, checkTorchCapability]);

  // Handle image file upload for scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const qrScanner = html5QrCodeRef.current || new Html5Qrcode(SCANNER_ELEMENT_ID);
      const decodedResult = await qrScanner.scanFile(file, true);
      if (decodedResult) {
        await stopScannerSafe(qrScanner);
        onScanSuccess(decodedResult);
      }
    } catch (err) {
      alert('No valid QR or barcode recognized in the selected image. Please try another photo.');
    }
  };

  // Handle manual code submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    setManualModalOpen(false);
    stopScannerSafe().then(() => {
      onScanSuccess(manualCodeInput.trim());
    });
  };

  const handlePresetSelect = (code) => {
    setManualModalOpen(false);
    setMenuOpen(false);
    stopScannerSafe().then(() => {
      onScanSuccess(code);
    });
  };

  const currentGuidance = GUIDANCE_LIST[guidanceIndex] || GUIDANCE_LIST[0];

  return (
    <div className="authnow-scanner-screen" role="main" aria-label="AuthNow Barcode Scanner">
      {/* ── Top Bar: White Hamburger Menu Button + Centered AuthNow Brand Logo ── */}
      <header className="authnow-top-bar">
        {/* Left white rounded square hamburger menu button */}
        <button
          type="button"
          className="authnow-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open scanner settings menu"
          id="openDrawer"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6H20M4 12H20M4 18H20"
              stroke="#2e2a72"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Center Brand Logo from Interface Logo.png */}
        <div className="authnow-brand-header">
          <img
            src="/Scanner%20Interface/Interface%20Logo.png"
            alt="now auth"
            className="authnow-brand-logo-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('authnow-svg-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="authnow-svg-fallback" style={{ display: 'none' }}>
            <AuthNowLogo />
          </div>
        </div>

        {/* Right spacing placeholder for perfect symmetry */}
        <div className="authnow-top-spacer" />
      </header>

      {/* ── Center Camera Viewfinder Area ── */}
      <section className="authnow-viewfinder-section">
        <div className="authnow-viewfinder-frame">
          {/* Live Camera Stream */}
          <div id={SCANNER_ELEMENT_ID} className="authnow-camera-mount" />

          {/* In-Camera Floating Guidance Pill (e.g. "Move back slowly") */}
          <div
            className="authnow-inframe-guidance-pill"
            onClick={handleCycleGuidance}
            title="Tap to change guidance"
          >
            {isValidating ? 'Validating code...' : currentGuidance.pill}
          </div>

          {/* Bottom-Right Torch / Flashlight FAB Button */}
          <button
            type="button"
            className={`authnow-torch-fab ${torchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            aria-label="Toggle Flashlight"
            id="torchButton"
            title="Toggle Flashlight"
          >
            <TorchIcon isOn={torchOn} />
          </button>
        </div>
      </section>

      {/* ── Middle Guidance Section (Below Camera) ── */}
      <section className="authnow-guidance-section">
        {/* Circular Info Button (i) */}
        <button
          type="button"
          className="authnow-info-circle-btn"
          onClick={() => setGuidanceModalOpen(true)}
          aria-label="Scanning tips & instructions"
          title="Scanning Tips"
        >
          i
        </button>

        {/* Dynamic Guidance Detail Text (e.g. "Move back a little more") */}
        <h2
          className="authnow-guidance-detail-text"
          onClick={handleCycleGuidance}
        >
          {isValidating
            ? 'Checking authenticity with registry...'
            : currentGuidance.detail}
        </h2>
      </section>

      {/* ── Bottom Pinned Vibrant Green "Authenticate" Button ── */}
      <footer className="authnow-bottom-bar">
        <button
          type="button"
          className="authnow-stop-btn"
          onClick={handleAuthenticateClick}
          id="scanner-stop-button"
        >
          Authenticate
        </button>
      </footer>

      {/* ── "Product not recognized" Modal (matching screenshot) ── */}
      {recognitionFailedModalOpen && (
        <div
          className="authnow-modal-backdrop"
          onClick={() => setRecognitionFailedModalOpen(false)}
        >
          <div
            className="authnow-not-recognized-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Product not recognized"
          >
            {/* Red Circle with Cross (X) icon */}
            <div className="not-recognized-icon-circle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" stroke="#f43f5e" strokeWidth="1.8" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            <h3 className="not-recognized-title">Product not recognized</h3>
            <p className="not-recognized-desc">This product could not be recognized.</p>

            <button
              type="button"
              className="not-recognized-ok-btn"
              onClick={() => setRecognitionFailedModalOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── Hidden File Input for Image Scanning ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ── Detailed Guidance / Tips Modal (Triggered by (i) Button) ── */}
      {guidanceModalOpen && (
        <div
          className="authnow-modal-backdrop"
          onClick={() => setGuidanceModalOpen(false)}
        >
          <div
            className="authnow-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Scanning Tips"
          >
            <div className="authnow-modal-header">
              <div className="authnow-modal-title-row">
                <div className="authnow-modal-icon-badge">
                  <FiAlertCircle />
                </div>
                <h3>Scanning Guidance</h3>
              </div>
              <button
                type="button"
                className="authnow-modal-close"
                onClick={() => setGuidanceModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="authnow-guidance-tips-list">
              <div className="guidance-tip-card">
                <div className="tip-badge">
                  <FiMaximize2 />
                </div>
                <div>
                  <h4>1. Maintain Good Distance</h4>
                  <p>Hold the device approximately 15–25 cm (6–10 inches) away from the product package.</p>
                </div>
              </div>

              <div className="guidance-tip-card">
                <div className="tip-badge">
                  <FiSun />
                </div>
                <div>
                  <h4>2. Ensure Adequate Lighting</h4>
                  <p>Avoid harsh light reflections, glares, or dark shadows on the QR code surface.</p>
                </div>
              </div>

              <div className="guidance-tip-card">
                <div className="tip-badge">
                  <FiCheckCircle />
                </div>
                <div>
                  <h4>3. Hold Steady</h4>
                  <p>Keep your phone still for 1–2 seconds until the code is automatically recognized.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="authnow-modal-action-btn"
              onClick={() => setGuidanceModalOpen(false)}
            >
              Got it, continue scanning
            </button>
          </div>
        </div>
      )}

      {/* ── Scanner Options & Presets Menu Drawer (Hamburger Click) ── */}
      {menuOpen && (
        <div
          className="authnow-modal-backdrop"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="authnow-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Scanner Options"
          >
            <div className="authnow-modal-header">
              <div className="authnow-modal-title-row">
                <h3>Scanner Options</h3>
              </div>
              <button
                type="button"
                className="authnow-modal-close"
                onClick={() => setMenuOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <p className="authnow-modal-subtext">
              Select an action or test the verification system with pre-configured codes:
            </p>

            <div className="authnow-menu-actions-list">
              <button
                type="button"
                className="authnow-menu-row-btn"
                onClick={() => {
                  setMenuOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <FiUploadCloud className="row-icon" />
                <span>Upload QR / Barcode image</span>
              </button>

              <button
                type="button"
                className="authnow-menu-row-btn"
                onClick={() => {
                  setMenuOpen(false);
                  setManualModalOpen(true);
                }}
              >
                <FiEdit3 className="row-icon" />
                <span>Enter product code manually</span>
              </button>

              <div className="menu-divider" />
              <div className="menu-section-label">Quick Test Presets:</div>

              <button
                type="button"
                className="authnow-menu-row-btn preset-authentic"
                onClick={() => handlePresetSelect('VALID-TG-001')}
              >
                <span className="dot dot-green" />
                <span>Test Authentic: <strong>VALID-TG-001</strong></span>
              </button>

              <button
                type="button"
                className="authnow-menu-row-btn preset-counterfeit"
                onClick={() => handlePresetSelect('FAKE-COUNTERFEIT-99')}
              >
                <span className="dot dot-red" />
                <span>Test Counterfeit: <strong>FAKE-COUNTERFEIT-99</strong></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Code Input Modal ── */}
      {manualModalOpen && (
        <div
          className="authnow-modal-backdrop"
          onClick={() => setManualModalOpen(false)}
        >
          <div
            className="authnow-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Enter Product Code"
          >
            <div className="authnow-modal-header">
              <div className="authnow-modal-title-row">
                <FiEdit3 className="modal-title-icon" />
                <h3>Enter Product Code</h3>
              </div>
              <button
                type="button"
                className="authnow-modal-close"
                onClick={() => setManualModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <p className="authnow-modal-subtext">
              Type or paste the security code or barcode printed on your product packaging.
            </p>

            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                className="authnow-input-field"
                placeholder="e.g. VALID-TG-001 or 7840001001234"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                autoFocus
              />

              <div className="menu-section-label">Presets:</div>
              <div className="modal-quick-chips">
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setManualCodeInput('VALID-TG-001')}
                >
                  VALID-TG-001
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setManualCodeInput('TG-20MG-BATCH44')}
                >
                  TG-20MG-BATCH44
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => setManualCodeInput('FAKE-COUNTERFEIT-99')}
                >
                  FAKE-COUNTERFEIT-99
                </button>
              </div>

              <div className="authnow-modal-btn-row">
                <button
                  type="button"
                  className="authnow-btn-secondary"
                  onClick={() => setManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="authnow-btn-primary">
                  Verify Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
