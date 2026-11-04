import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  FiUploadCloud,
  FiEdit3,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiSun,
  FiMaximize2,
} from 'react-icons/fi';

const SCANNER_ELEMENT_ID = 'html5-qrcode-reader';

// Guidance cues for QR verification
const GUIDANCE_LIST = [
  {
    pill: 'Move a little closer',
    detail: 'Move a little closer',
  },
  {
    pill: 'Move back slowly',
    detail: 'Move back a little more',
  },
  {
    pill: 'Hold steady',
    detail: 'Hold steady',
  },
  {
    pill: 'Find good lighting',
    detail: 'Avoid reflections or heavy glare',
  },
];

/**
 * Pixel-perfect Torch / Flashlight Icon matching Image 3 reference
 * 45-degree angled flashlight with 3 light rays radiating top-right
 */
function TorchIcon({ isOn }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isOn ? '#facc15' : '#ffffff'}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: isOn ? 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.9))' : 'none',
        display: 'block',
      }}
    >
      {/* Front rim / lens */}
      <path d="M16 4l4 4" />
      {/* Beveled head */}
      <path d="M14 6l4 4-2 2-4-4 2-2z" />
      {/* Flashlight barrel / handle */}
      <path d="M12 8L5.5 14.5c-.8.8-.8 2 0 2.8l1.2 1.2c.8.8 2 .8 2.8 0L16 12" />
      {/* Switch pill */}
      <line x1="8.5" y1="13.5" x2="10" y2="12" />
      {/* 3 Radiating Light Rays */}
      <line x1="19" y1="2" x2="20" y2="1" />
      <line x1="22" y1="5" x2="23.5" y2="3.5" />
      <line x1="21.5" y1="8.5" x2="23" y2="9.5" />
    </svg>
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

  // Rotate guidance tips periodically while scanning
  useEffect(() => {
    if (isValidating) return;
    const interval = setInterval(() => {
      setGuidanceIndex((prev) => (prev + 1) % GUIDANCE_LIST.length);
    }, 4200);
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

  // Helper to reliably find the active video track from all available sources
  const getActiveVideoTrack = useCallback(() => {
    // 1. Try from html5QrCode renderedCamera instance
    try {
      const renderedCamera = html5QrCodeRef.current?.renderedCamera;
      if (renderedCamera) {
        if (typeof renderedCamera.getFirstTrackOrFail === 'function') {
          const t = renderedCamera.getFirstTrackOrFail();
          if (t && t.readyState === 'live') return t;
        }
        if (renderedCamera.mediaStream) {
          const tracks = renderedCamera.mediaStream.getVideoTracks();
          if (tracks && tracks.length > 0 && tracks[0].readyState === 'live') {
            return tracks[0];
          }
        }
      }
    } catch (e) {
      // Continue to next probe
    }

    // 2. Try from video element in DOM
    try {
      const videoElem = document.querySelector(`#${SCANNER_ELEMENT_ID} video`) ||
                        document.querySelector('video');
      if (videoElem && videoElem.srcObject && typeof videoElem.srcObject.getVideoTracks === 'function') {
        const tracks = videoElem.srcObject.getVideoTracks();
        if (tracks && tracks.length > 0 && tracks[0].readyState === 'live') {
          return tracks[0];
        }
      }
    } catch (e) {
      // Continue
    }

    return null;
  }, []);

  // Inspect track to check if torch/flashlight is supported
  const checkTorchCapability = useCallback((scanner) => {
    try {
      // 1. Check via html5QrCode camera capabilities
      if (scanner && typeof scanner.getRunningTrackCameraCapabilities === 'function') {
        const caps = scanner.getRunningTrackCameraCapabilities();
        const torch = caps?.torchFeature?.();
        if (torch && typeof torch.isSupported === 'function' && torch.isSupported()) {
          setTorchAvailable(true);
          return;
        }
      }

      // 2. Check via direct track getCapabilities
      const track = getActiveVideoTrack();
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        if (caps && ('torch' in caps || caps.fillLightMode)) {
          setTorchAvailable(true);
          return;
        }
      }

      // Default to available so user can try hardware toggle
      setTorchAvailable(true);
    } catch (e) {
      setTorchAvailable(true);
    }
  }, [getActiveVideoTrack]);

  // Robust multi-method flashlight / torch toggle
  const toggleTorch = async () => {
    const newTorchState = !torchOn;
    let success = false;

    // Haptic feedback if supported on mobile
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(35);
      } catch (e) {
        // Ignore vibration error
      }
    }

    // Attempt Method 1: html5QrCode torchFeature
    if (html5QrCodeRef.current) {
      try {
        if (typeof html5QrCodeRef.current.getRunningTrackCameraCapabilities === 'function') {
          const cameraCaps = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
          const torchFeature = cameraCaps?.torchFeature?.();
          if (torchFeature) {
            await torchFeature.apply(newTorchState);
            success = true;
          }
        }
      } catch (err) {
        console.warn('[Torch] Method 1 (torchFeature) failed:', err);
      }
    }

    // Attempt Method 2: Direct track applyConstraints with advanced torch
    if (!success) {
      try {
        const track = getActiveVideoTrack();
        if (track && typeof track.applyConstraints === 'function') {
          await track.applyConstraints({
            advanced: [{ torch: newTorchState }],
          });
          success = true;
        }
      } catch (err) {
        console.warn('[Torch] Method 2 (track advanced torch) failed:', err);
      }
    }

    // Attempt Method 3: Direct track applyConstraints with plain torch
    if (!success) {
      try {
        const track = getActiveVideoTrack();
        if (track && typeof track.applyConstraints === 'function') {
          await track.applyConstraints({
            torch: newTorchState,
          });
          success = true;
        }
      } catch (err) {
        console.warn('[Torch] Method 3 (track direct torch) failed:', err);
      }
    }

    // Attempt Method 4: html5QrCode applyVideoConstraints
    if (!success && html5QrCodeRef.current) {
      try {
        if (typeof html5QrCodeRef.current.applyVideoConstraints === 'function') {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: newTorchState }],
          });
          success = true;
        }
      } catch (err) {
        console.warn('[Torch] Method 4 (applyVideoConstraints) failed:', err);
      }
    }

    // Attempt Method 5: ImageCapture / fillLightMode fallback
    if (!success && typeof window !== 'undefined' && 'ImageCapture' in window) {
      try {
        const track = getActiveVideoTrack();
        if (track) {
          await track.applyConstraints({
            advanced: [{ torch: newTorchState, fillLightMode: newTorchState ? 'torch' : 'off' }],
          });
          success = true;
        }
      } catch (err) {
        console.warn('[Torch] Method 5 (ImageCapture fillLightMode) failed:', err);
      }
    }

    // Always toggle visual state so UI responds immediately
    setTorchOn(newTorchState);
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
      // Normal continuous frame search without match
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
        setTimeout(() => checkTorchCapability(html5QrCode), 300);
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

  const handleStopClick = () => {
    stopScannerSafe().then(() => {
      onCancel();
    });
  };

  const currentGuidance = GUIDANCE_LIST[guidanceIndex] || GUIDANCE_LIST[0];

  return (
    <div className="authnow-scanner-screen" role="main" aria-label="Indufar Barcode Scanner">
      {/* ── Top Bar: White Hamburger Menu Button + Centered INDUFAR Logo ── */}
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

        {/* Center INDUFAR Brand Logo matching Image 3 reference */}
        <div className="scanner-indufar-brand-wrap">
          <img
            src="/logo.png"
            alt="INDUFAR"
            className="scanner-indufar-logo-img"
          />
        </div>

        {/* Right spacing placeholder for perfect symmetry */}
        <div className="authnow-top-spacer" />
      </header>

      {/* ── Center Camera Viewfinder Area (Outer Card Frame) ── */}
      <section className="authnow-viewfinder-section">
        <div className="authnow-viewfinder-frame">
          {/* Live Camera Stream */}
          <div id={SCANNER_ELEMENT_ID} className="authnow-camera-mount" />

          {/* Loading state before camera starts */}
          {!cameraReady && !cameraError && (
            <div className="scanner-camera-loading-overlay">
              <span>Loading... Please wait.</span>
            </div>
          )}

          {/* Camera Permission / Error Fallback */}
          {cameraError && (
            <div className="authnow-camera-fallback">
              <p className="authnow-fallback-text">{cameraError}</p>
              <button
                type="button"
                className="authnow-fallback-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload packaging image
              </button>
            </div>
          )}

          {/* Central QR Scanning Window: 67% bright area with remaining 33% darkened */}
          <div className="scanner-scan-window" aria-hidden="true">
            {/* 4 Green Corner Reticle Brackets framing 67% scanning window */}
            <span className="reticle-corner top-left" />
            <span className="reticle-corner top-right" />
            <span className="reticle-corner bottom-left" />
            <span className="reticle-corner bottom-right" />
          </div>

          {/* Dark Translucent Horizontal Strip with Centered Bold Green Text */}
          <div className="scanner-focus-strip" aria-hidden="true">
            <span className="scanner-focus-text">Focus the QR code</span>
          </div>

          {/* Bottom-Right Torch / Flashlight FAB Button overlapping viewfinder frame */}
          <button
            type="button"
            className={`authnow-torch-fab ${torchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            aria-label="Toggle Flashlight"
            id="torchButton"
            title={torchAvailable ? 'Toggle Flashlight' : 'Flashlight'}
          >
            <TorchIcon isOn={torchOn} />
          </button>
        </div>
      </section>

      {/* ── White Capsule Progress Bar (Directly below viewfinder, matching Image 3) ── */}
      <div className="scanner-white-capsule-bar" aria-hidden="true" />

      {/* ── Middle Guidance Section (Below Bar) ── */}
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

        {/* Dynamic Guidance Detail Text (e.g. "Move a little closer") */}
        <h2
          className="authnow-guidance-detail-text"
          onClick={handleCycleGuidance}
        >
          {isValidating
            ? 'Checking authenticity with registry...'
            : currentGuidance.detail}
        </h2>
      </section>

      {/* ── Bottom Pinned Vibrant Green "Stop" Button (matching Image 3) ── */}
      <footer className="authnow-bottom-bar">
        <button
          type="button"
          className="authnow-stop-btn"
          onClick={handleStopClick}
          id="scanner-stop-button"
        >
          Stop
        </button>
      </footer>

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
