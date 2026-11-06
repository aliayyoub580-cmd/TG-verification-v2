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
import CounterfeitModal from './CounterfeitModal.jsx';
import IosSpinner from './IosSpinner.jsx';

const SCANNER_ELEMENT_ID = 'html5-qrcode-reader';

// Paired viewfinder strip & guidance cues for QR verification
const SCANNER_GUIDANCE_CUES = [
  {
    stripText: 'Focus the QR code',
    bottomText: 'Move back a little more',
  },
  {
    stripText: 'Move closer',
    bottomText: 'Move a little closer',
  },
];

/**
 * Official Torch / Flashlight Icon from user Asset 1
 */
function TorchIcon({ isOn, size = 25 }) {
  const iconColor = isOn ? '#facc15' : '#ffffff';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 481.19 481.01"
      fill={iconColor}
      style={{
        filter: isOn ? 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.9))' : 'none',
        display: 'block',
      }}
      aria-hidden="true"
    >
      <path d="m240.04,70.78c10.29.26,18.27,4.36,25.18,11.31,33.38,33.53,66.88,66.95,100.33,100.4,11.31,11.31,22.67,22.57,33.91,33.95,14.73,14.9,14.75,33.98-.06,48.69-7.79,7.74-15.09,16.02-23.82,22.78-10.78,8.35-23.77,11.87-36.22,16.48-23.58,8.73-47.23,17.25-70.89,25.75-3.1,1.11-5.52,2.91-7.79,5.18-42.63,42.66-85.3,85.28-127.91,127.96-9.34,9.36-20.1,15.76-33.47,17.32-15.85,1.85-29.95-2.43-41.41-13.27-15.12-14.3-29.86-29.05-44.19-44.15-19.22-20.25-18.04-52.06,2.41-72.64,32.06-32.26,64.29-64.35,96.45-96.51,11.19-11.19,22.36-22.41,33.6-33.55,2.3-2.28,3.96-4.8,5.06-7.87,10.34-28.84,20.79-57.64,31.15-86.47,3.95-10.99,9.77-20.75,18.12-28.98,5.7-5.61,11.26-11.36,17-16.93,6.37-6.2,14.07-9.31,22.56-9.44Zm145.03,170.16c.05-3.86-2.53-5.9-4.75-8.12-32.62-32.65-65.25-65.28-97.89-97.91-11.78-11.78-23.53-23.6-35.37-35.32-4.71-4.66-8.7-4.61-13.41-.05-3.83,3.71-7.45,7.63-11.36,11.26-7.7,7.16-13.43,15.46-16.96,25.5-9.52,27.01-19.35,53.91-29.2,80.8-1.15,3.13-.72,5.09,1.66,7.43,26.45,26.09,52.82,52.26,79.13,78.48,2.44,2.43,4.61,3.04,7.95,1.81,27.18-10.03,54.43-19.87,81.65-29.8,5.98-2.18,11.77-4.85,16.44-9.27,6.54-6.17,12.86-12.58,19.25-18.92,1.69-1.68,2.97-3.61,2.87-5.9ZM25.55,388.16c-.29,8.08,2.93,14.59,8.5,20.14,12.87,12.82,25.65,25.72,38.55,38.51,12.16,12.06,28.36,12.53,40.5.47,41.27-40.97,82.29-82.2,123.47-123.25,2.36-2.36,2.22-3.79-.07-6.05-24.42-24.12-48.78-48.3-73.07-72.55-2.59-2.59-4.21-2.67-6.87,0-40.93,41.08-81.95,82.06-122.95,123.07-5.44,5.44-8.4,11.93-8.07,19.67Z" />
      <path d="m366.46,127.42c-4.91.08-9.75-2.83-11.55-7.3-2.04-5.06-1.4-9.88,2.5-13.87,6.98-7.15,14.08-14.17,21.14-21.24,6.35-6.36,12.66-12.77,19.09-19.05,5.65-5.52,13.37-5.88,18.29-1.03,5.14,5.06,5.31,12.55-.31,18.3-13.26,13.58-26.77,26.91-40.24,40.28-2.41,2.4-5.38,3.92-8.93,3.91Z" />
      <path d="m415.1,178.9c-.07-5.45,2.62-9.99,8.22-11.85,14.04-4.66,28.15-9.12,42.36-13.22,6.63-1.91,12.95,2.08,14.91,8.42,1.92,6.21-.81,12.83-7.29,15.02-14.48,4.91-29.07,9.51-43.78,13.65-7.16,2.01-14.32-4.46-14.42-12.02Z" />
      <path d="m290.1,51.74c4.64-14.27,8.34-30.87,15.28-46.37,2.17-4.85,8.39-6.35,13.48-4.76,5.44,1.71,9.82,6.5,8.71,11.87-3.46,16.59-8.52,32.79-15.1,48.42-2.05,4.87-8.31,6.35-13.47,4.74-5.47-1.71-8.86-6.25-8.9-13.9Z" />
      <path d="m185.87,307.93c.16,3.61-1.57,6.77-4.24,9.46-9.05,9.1-18.05,18.24-27.25,27.19-6.15,5.99-13.39,6.16-18.64.85-5.2-5.26-4.88-12.63,1.02-18.59,9.26-9.36,18.56-18.68,27.95-27.9,3.89-3.82,8.56-5,13.78-2.78,4.66,1.98,7.4,6.24,7.38,11.77Z" />
    </svg>
  );
}

/**
 * Circle Icon with Checkmark matching authentic transition state
 */
function AuthenticCircleCheckIcon({ size = 52 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      style={{ display: 'block', margin: '0 auto' }}
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="24"
        stroke="#c4cae0"
        strokeWidth="3.6"
        fill="rgba(255, 255, 255, 0.05)"
      />
      <path
        d="M19 28.5 L25 34.5 L37 22"
        stroke="#22c55e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ScannerView({
  onScanSuccess,
  onCancel: _onCancel,
  isValidating = false,
  isAuthenticTransition = false,
  isCounterfeitOpen = false,
  onCloseCounterfeit,
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
  const [internalCounterfeitOpen, setInternalCounterfeitOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStoppingRef = useRef(false);

  // When external counterfeit alert opens (e.g. invalid QR scan), pause the camera
  useEffect(() => {
    if (isCounterfeitOpen) {
      setIsPaused(true);
      if (html5QrCodeRef.current?.isScanning) {
        try {
          html5QrCodeRef.current.pause(true);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isCounterfeitOpen]);

  // Rotate guidance tips periodically while scanning
  useEffect(() => {
    if (isValidating) return;
    const interval = setInterval(() => {
      setGuidanceIndex((prev) => (prev + 1) % SCANNER_GUIDANCE_CUES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isValidating]);

  // Handle manual next guidance trigger (e.g. clicking guidance text)
  const handleCycleGuidance = () => {
    setGuidanceIndex((prev) => (prev + 1) % SCANNER_GUIDANCE_CUES.length);
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

    // Release any pre-warmed stream tracks before html5QrCode grabs hardware
    if (window.__indufarPrewarmedStream) {
      try {
        window.__indufarPrewarmedStream
          .getTracks()
          .forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
      window.__indufarPrewarmedStream = null;
    }

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
        try {
          localStorage.setItem('tg_camera_permission_granted', 'true');
        } catch (e) {
          // ignore
        }
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

  // When user clicks the bottom button (Stop / Retry)
  const handleBottomButtonClick = () => {
    if (isPaused) {
      // If paused, clicking "Retry" resumes camera scanning
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.resume();
        } catch (e) {
          // ignore
        }
      }
      setIsPaused(false);
      setInternalCounterfeitOpen(false);
      if (onCloseCounterfeit) {
        onCloseCounterfeit();
      }
    } else {
      // User clicked "Stop": show Counterfeit Disclaimer popup and pause camera
      setInternalCounterfeitOpen(true);
      setIsPaused(true);
      if (html5QrCodeRef.current?.isScanning) {
        try {
          html5QrCodeRef.current.pause(true);
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // When user clicks "Understood" on the Counterfeit alert
  const handleCloseCounterfeitModal = () => {
    setInternalCounterfeitOpen(false);
    if (onCloseCounterfeit) {
      onCloseCounterfeit();
    }
    // Resume camera scanning so user can scan another code immediately
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
        setIsPaused(false);
      } catch (e) {
        // ignore
      }
    }
  };

  const currentGuidance =
    SCANNER_GUIDANCE_CUES[guidanceIndex] || SCANNER_GUIDANCE_CUES[0];

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
        <div className={`authnow-viewfinder-frame ${isAuthenticTransition ? 'is-authentic-transition' : ''}`}>
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
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: '4px 0 12px 0',
                  textAlign: 'center',
                  maxWidth: '280px',
                  lineHeight: '1.4',
                }}
              >
                On iPhone: Tap the <strong>aA</strong> icon in the Safari address bar → <strong>Website Settings</strong> → <strong>Camera</strong> → <strong>Allow</strong> to never be asked again.
              </p>
              <button
                type="button"
                className="authnow-fallback-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload packaging image
              </button>
            </div>
          )}

          {/* Authentic Product Verified 1s Loading Transition Overlay */}
          {isAuthenticTransition && (
            <div className="scanner-authentic-overlay" role="status" aria-label="Authentic Product Verified">
              <div className="authentic-card-shield-wrap">
                <AuthenticCircleCheckIcon size={52} />
              </div>
              <h3 className="authentic-card-title">Authentic Product!</h3>
              <div className="authentic-card-spinner-wrap">
                <IosSpinner size={34} color="#ffffff" />
              </div>
              <p className="authentic-card-desc">
                The label of this product<br />was successfully verified
              </p>
            </div>
          )}

          {/* Central QR Scanning Window: 67% bright area with remaining 33% darkened */}
          {!isAuthenticTransition && (
            <>
              <div className="scanner-scan-window" aria-hidden="true">
                {/* 4 Green Corner Reticle Brackets framing 67% scanning window */}
                <span className="reticle-corner top-left" />
                <span className="reticle-corner top-right" />
                <span className="reticle-corner bottom-left" />
                <span className="reticle-corner bottom-right" />
              </div>

              {/* Dark Translucent Horizontal Strip with Centered Bold Green Text */}
              <div className="scanner-focus-strip" aria-hidden="true">
                <span className="scanner-focus-text">{currentGuidance.stripText}</span>
              </div>
            </>
          )}

          {/* Bottom-Right Torch / Flashlight FAB Button overlapping viewfinder frame */}
          <button
            type="button"
            className={`authnow-torch-fab ${torchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            aria-label="Toggle Flashlight"
            id="torchButton"
            title={torchAvailable ? 'Toggle Flashlight' : 'Flashlight'}
            disabled={isAuthenticTransition}
          >
            <TorchIcon isOn={torchOn} />
          </button>
        </div>
      </section>

      {/* ── White Capsule Progress Bar (Directly below viewfinder, matching Image 3) ── */}
      {!isAuthenticTransition && (
        <div className="scanner-white-capsule-bar" aria-hidden="true" />
      )}

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

        {/* Dynamic Guidance Detail Text (paired with viewfinder strip) */}
        <h2
          className="authnow-guidance-detail-text"
          onClick={!isAuthenticTransition ? handleCycleGuidance : undefined}
        >
          {isAuthenticTransition
            ? 'Redirecting ...'
            : isValidating
            ? 'Checking authenticity with registry...'
            : currentGuidance.bottomText}
        </h2>
      </section>

      {/* ── Bottom Pinned Vibrant Green "Stop" / "Retry" Button (matching Image 3) ── */}
      <footer className="authnow-bottom-bar">
        <button
          type="button"
          className={`authnow-stop-btn ${isAuthenticTransition ? 'is-redirecting' : ''}`}
          onClick={handleBottomButtonClick}
          id="scanner-stop-button"
          disabled={isAuthenticTransition}
        >
          {isAuthenticTransition ? (
            <span className="stop-btn-loading-wrap">
              <span className="stop-btn-spinner" />
              <span>Stop</span>
            </span>
          ) : isPaused ? (
            'Retry'
          ) : (
            'Stop'
          )}
        </button>
      </footer>

      {/* ── Counterfeit Product Disclaimer Modal ── */}
      <CounterfeitModal
        isOpen={internalCounterfeitOpen || isCounterfeitOpen}
        onClose={handleCloseCounterfeitModal}
      />

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
