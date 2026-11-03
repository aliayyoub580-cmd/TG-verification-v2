import React, { useState } from 'react';

/**
 * OnboardingInstructions
 * Displays the 3-step instructions modal matching Image 2 exactly:
 * - 1. Scan your product (with QR icon)
 * - 2. Find good lighting
 * - 3. Adjust the distance
 * - Agreement checkbox with Privacy Policy link
 * - Authenticate button (disabled grey when unchecked, active when checked)
 */
export default function OnboardingInstructions({ onStartScan }) {
  const [agreed, setAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleAuthenticate = () => {
    if (agreed) {
      onStartScan();
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Step 1 */}
        <div className="onboarding-step-row">
          <div className="onboarding-step-num">1</div>
          <div className="onboarding-step-body">
            <h3 className="onboarding-step-title">Scan your product</h3>
            <p className="onboarding-step-desc">Scan the QR code</p>
            {/* Authentic Light-Grey QR Code Vector matching reference */}
            <div className="onboarding-qr-wrap" aria-hidden="true">
              <svg
                width="62"
                height="62"
                viewBox="0 0 70 70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="onboarding-qr-svg"
              >
                {/* Top-Left Finder */}
                <rect x="2" y="2" width="22" height="22" rx="4" stroke="#c4cbd5" strokeWidth="4" />
                <rect x="9" y="9" width="8" height="8" rx="2" fill="#c4cbd5" />

                {/* Top-Right Finder */}
                <rect x="46" y="2" width="22" height="22" rx="4" stroke="#c4cbd5" strokeWidth="4" />
                <rect x="53" y="9" width="8" height="8" rx="2" fill="#c4cbd5" />

                {/* Bottom-Left Finder */}
                <rect x="2" y="46" width="22" height="22" rx="4" stroke="#c4cbd5" strokeWidth="4" />
                <rect x="9" y="53" width="8" height="8" rx="2" fill="#c4cbd5" />

                {/* Data modules & timing patterns */}
                <rect x="28" y="4" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="38" y="4" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="30" y="11" width="5" height="4" rx="1" fill="#c4cbd5" />
                <rect x="30" y="18" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="38" y="18" width="4" height="4" rx="1" fill="#c4cbd5" />

                <rect x="4" y="28" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="11" y="32" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="18" y="28" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="18" y="38" width="4" height="4" rx="1" fill="#c4cbd5" />

                <rect x="28" y="28" width="6" height="6" rx="1.5" fill="#c4cbd5" />
                <rect x="38" y="28" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="28" y="38" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="37" y="37" width="6" height="6" rx="1.5" fill="#c4cbd5" />

                <rect x="48" y="28" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="58" y="32" width="5" height="4" rx="1" fill="#c4cbd5" />
                <rect x="48" y="38" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="60" y="40" width="4" height="4" rx="1" fill="#c4cbd5" />

                <rect x="28" y="48" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="38" y="48" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="28" y="58" width="4" height="4" rx="1" fill="#c4cbd5" />
                <rect x="37" y="56" width="6" height="6" rx="1.5" fill="#c4cbd5" />

                <rect x="48" y="48" width="6" height="6" rx="1.5" fill="#c4cbd5" />
                <rect x="58" y="50" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="50" y="58" width="5" height="5" rx="1" fill="#c4cbd5" />
                <rect x="60" y="60" width="4" height="4" rx="1" fill="#c4cbd5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="onboarding-step-row">
          <div className="onboarding-step-num">2</div>
          <div className="onboarding-step-body">
            <h3 className="onboarding-step-title">Find good lighting</h3>
            <p className="onboarding-step-desc">Make sure you are in a well-lit place</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="onboarding-step-row">
          <div className="onboarding-step-num">3</div>
          <div className="onboarding-step-body">
            <h3 className="onboarding-step-title">Adjust the distance</h3>
            <p className="onboarding-step-desc">Move closer and farther away as instructed</p>
          </div>
        </div>

        {/* Agreement Checkbox Box (matching Image 2) */}
        <div className="onboarding-agreement-box">
          <label className="onboarding-agreement-label">
            <input
              type="checkbox"
              className="onboarding-checkbox-input"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              id="privacy-checkbox"
            />
            <span className="onboarding-agreement-text">
              I agree to the{' '}
              <button
                type="button"
                className="onboarding-policy-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPrivacyModal(true);
                }}
              >
                Privacy Policy
              </button>{' '}
              (camera and location use for QR validation).
            </span>
          </label>
        </div>

        {/* Bottom Action: Authenticate Button (disabled grey until agreed) */}
        <div className="onboarding-bottom-action">
          <button
            type="button"
            className={`onboarding-auth-btn ${!agreed ? 'is-disabled' : 'is-active'}`}
            disabled={!agreed}
            onClick={handleAuthenticate}
            id="onboarding-authenticate-button"
          >
            Authenticate
          </button>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="authnow-modal-backdrop"
          onClick={() => setShowPrivacyModal(false)}
          style={{ zIndex: 120 }}
        >
          <div
            className="authnow-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Privacy Policy"
          >
            <div className="authnow-modal-header">
              <div className="authnow-modal-title-row">
                <h3>Privacy Policy & Consent</h3>
              </div>
              <button
                type="button"
                className="authnow-modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>
            <p className="authnow-modal-subtext" style={{ fontSize: '13.5px', lineHeight: '1.5', color: '#475569' }}>
              <strong>Camera Access:</strong> Camera video is processed locally in real-time inside your browser solely to detect and decode security QR codes on Indufar packaging. No video feeds or frames are uploaded or saved.
              <br /><br />
              <strong>Location Use:</strong> Approximate regional location is used strictly to verify authentic product distribution zones and detect counterfeit batches.
            </p>
            <button
              type="button"
              className="authnow-modal-action-btn"
              onClick={() => {
                setAgreed(true);
                setShowPrivacyModal(false);
              }}
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
