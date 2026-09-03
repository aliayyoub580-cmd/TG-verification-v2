import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  FiMenu,
  FiZap,
  FiZapOff,
  FiUploadCloud,
  FiEdit3,
  FiX,
  FiCameraOff,
} from 'react-icons/fi';
import { RiShieldCheckFill } from 'react-icons/ri';

const SCANNER_ELEMENT_ID = 'html5-qrcode-reader';

export default function ScannerView({
  onScanSuccess,
  onCancel,
  isValidating = false,
}) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hintText, setHintText] = useState('Point your camera at the QR code');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Initialize and start scanner on mount
  useEffect(() => {
    isStoppingRef.current = false;

    // Supported formats for both QR codes and standard product barcodes
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
      setHintText('Code detected! Validating...');

      // Stop camera before notifying parent
      stopScannerSafe(html5QrCode).then(() => {
        onScanSuccess(decodedText);
      });
    };

    const qrCodeErrorCallback = () => {
      // Periodic scan ticks without match
      // Keep static or dynamic hint
    };

    const config = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const edge = Math.min(viewfinderWidth, viewfinderHeight);
        return {
          width: Math.max(Math.floor(edge * 0.85), 200),
          height: Math.max(Math.floor(edge * 0.85), 200),
        };
      },
      aspectRatio: 1.0,
    };

    // Request camera stream (environment facing camera)
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
        setHintText('Focus the QR or barcode inside the frame');
        checkTorchCapability(html5QrCode);
      })
      .catch((err) => {
        console.warn('Camera start failed or permission denied:', err);
        setCameraReady(false);
        setCameraError(
          err?.message || 'Camera access not granted or unavailable on this device.'
        );
        setHintText('Camera unavailable. Use photo upload or manual entry below.');
      });

    // Cleanup on unmount
    return () => {
      isStoppingRef.current = true;
      stopScannerSafe(html5QrCode);
    };
  }, [onScanSuccess]);

  // Safe camera stop helper
  const stopScannerSafe = async (scannerInstance) => {
    const scanner = scannerInstance || html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        // Ignore stop errors if already stopped
      }
    }
  };

  // Inspect track to check if torch/flashlight is supported
  const checkTorchCapability = (scanner) => {
    try {
      // Check if applyVideoConstraints / track has torch
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
      // Alternatively check scanner capabilities
      if (scanner && typeof scanner.getRunningTrackCameraCapabilities === 'function') {
        const caps = scanner.getRunningTrackCameraCapabilities();
        if (caps?.torchFeature()?.isSupported()) {
          setTorchAvailable(true);
        }
      }
    } catch (e) {
      setTorchAvailable(false);
    }
  };

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
      console.warn('Torch toggle failed:', err);
      // If hardware fails, just toggle state representation
      setTorchOn(false);
    }
  };

  // Handle image file upload for scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHintText('Analyzing selected image...');
    try {
      const qrScanner = html5QrCodeRef.current || new Html5Qrcode(SCANNER_ELEMENT_ID);
      const decodedResult = await qrScanner.scanFile(file, true);
      if (decodedResult) {
        await stopScannerSafe(qrScanner);
        onScanSuccess(decodedResult);
      }
    } catch (err) {
      setHintText('No valid QR/barcode found in image. Try another image.');
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

  const handleManualPreset = (presetCode) => {
    setManualModalOpen(false);
    stopScannerSafe().then(() => {
      onScanSuccess(presetCode);
    });
  };

  return (
    <div className="appclip-scanner-view" role="main" aria-label="Camera Barcode Scanner">
      {/* ── Top Bar ── */}
      <div className="scanner-top-bar">
        <button
          type="button"
          className="scanner-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Scanner options menu"
        >
          <FiMenu />
        </button>

        {/* Center Brand Logo (shield-check + authnow) */}
        <div className="scanner-brand-logo">
          <RiShieldCheckFill className="scanner-brand-icon" />
          <span className="scanner-brand-name">
            auth<span>now</span>
          </span>
        </div>

        <div className="scanner-top-placeholder" />
      </div>

      {/* ── Center Reticle / Camera View Area ── */}
      <div className="scanner-center-area">
        <div className="scanner-reticle-wrap">
          {/* HTML5 QR Code Mount Element */}
          <div id={SCANNER_ELEMENT_ID} className="scanner-video-feed" />

          {/* Fallback View when camera has error */}
          {cameraError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                background: '#090d22',
                color: '#94a3b8',
                zIndex: 4,
              }}
            >
              <FiCameraOff style={{ fontSize: '36px', color: '#f43f5e', marginBottom: '10px' }} />
              <p style={{ fontSize: '13px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                Camera permission needed or camera unavailable.
              </p>
              <button
                type="button"
                className="scanner-fallback-chip"
                onClick={() => setManualModalOpen(true)}
              >
                <FiEdit3 /> Enter Code Manually
              </button>
            </div>
          )}

          {/* Corner Brackets Overlay Frame */}
          <div className="scanner-reticle-frame">
            <div className="reticle-corner top-left" />
            <div className="reticle-corner top-right" />
            <div className="reticle-corner bottom-left" />
            <div className="reticle-corner bottom-right" />
          </div>

          {/* Laser Sweep Animation Line (active while scanning) */}
          {!isValidating && <div className="scanner-laser" />}

          {/* Flashlight / Torch Toggle Button (bottom-right of reticle) */}
          {(torchAvailable || cameraReady) && (
            <button
              type="button"
              className={`scanner-torch-btn ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              aria-label="Toggle flashlight"
              title="Toggle Flashlight"
            >
              {torchOn ? <FiZapOff /> : <FiZap />}
            </button>
          )}
        </div>

        {/* Thin Progress / Loading Bar under camera view */}
        <div className="scanner-progress-bar-wrap">
          <div
            className={`scanner-progress-bar ${
              isValidating ? 'loading-indeterminate' : ''
            }`}
            style={{ width: isValidating ? '100%' : cameraReady ? '100%' : '20%' }}
          />
        </div>

        {/* Dynamic Overlay Hint Text */}
        <div className="scanner-hint-text">
          {isValidating ? 'Checking with Indufar registry...' : hintText}
        </div>

        {/* Secondary fallback options (file upload & manual entry) */}
        <div className="scanner-fallback-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="scanner-fallback-chip"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUploadCloud /> Scan Photo
          </button>
          <button
            type="button"
            className="scanner-fallback-chip"
            onClick={() => setManualModalOpen(true)}
          >
            <FiEdit3 /> Type Code
          </button>
        </div>
      </div>

      {/* ── Pinned Full-Width Green "Stop" Button ── */}
      <div className="scanner-bottom-bar">
        <button
          type="button"
          className="scanner-stop-btn"
          onClick={() => {
            stopScannerSafe().then(() => onCancel());
          }}
          id="scanner-stop-button"
        >
          Stop
        </button>
      </div>

      {/* ── Menu Drawer / Dropdown ── */}
      {menuOpen && (
        <div className="scanner-modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div
            className="scanner-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '340px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Scanner Options</h4>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setMenuOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Select a verification mode or test code preset:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="modal-chip-btn"
                style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px' }}
                onClick={() => {
                  setMenuOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                📷 Upload QR / Barcode image
              </button>
              <button
                type="button"
                className="modal-chip-btn"
                style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px' }}
                onClick={() => {
                  setMenuOpen(false);
                  setManualModalOpen(true);
                }}
              >
                ⌨️ Enter code manually
              </button>
              <button
                type="button"
                className="modal-chip-btn"
                style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', color: '#16a34a', fontWeight: 700 }}
                onClick={() => handleManualPreset('VALID-TG-001')}
              >
                ✅ Test Authentic: VALID-TG-001
              </button>
              <button
                type="button"
                className="modal-chip-btn"
                style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', color: '#dc2626', fontWeight: 700 }}
                onClick={() => handleManualPreset('FAKE-COUNTERFEIT-99')}
              >
                ❌ Test Counterfeit: FAKE-COUNTERFEIT-99
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Code Input Modal (Crucial for desktop & testing) ── */}
      {manualModalOpen && (
        <div
          className="scanner-modal-backdrop"
          onClick={() => setManualModalOpen(false)}
        >
          <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="scanner-modal-title">Enter Product Code</h3>
            <p className="scanner-modal-desc">
              Type or paste the alphanumeric code or barcode printed on your Indufar product.
            </p>

            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                className="scanner-modal-input"
                placeholder="e.g. VALID-TG-001 or 7840001001234"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                autoFocus
              />

              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                Quick Test Presets:
              </div>
              <div className="modal-quick-chips">
                <button
                  type="button"
                  className="modal-chip-btn"
                  onClick={() => setManualCodeInput('VALID-TG-001')}
                >
                  VALID-TG-001 (Authentic)
                </button>
                <button
                  type="button"
                  className="modal-chip-btn"
                  onClick={() => setManualCodeInput('TG-20MG-BATCH44')}
                >
                  TG-20MG-BATCH44
                </button>
                <button
                  type="button"
                  className="modal-chip-btn"
                  onClick={() => setManualCodeInput('7840001001234')}
                >
                  EAN Barcode
                </button>
                <button
                  type="button"
                  className="modal-chip-btn"
                  onClick={() => setManualCodeInput('FAKE-COUNTERFEIT-99')}
                >
                  FAKE-COUNTERFEIT-99
                </button>
              </div>

              <div className="scanner-modal-btns">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
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
