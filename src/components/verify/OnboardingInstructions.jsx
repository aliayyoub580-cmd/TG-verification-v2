import React, { useState, useEffect } from 'react';

/**
 * OnboardingInstructions
 * Displays the 3-step instructions modal with animated progress bar.
 * When the progress completes (100%), the progress bar transitions to
 * an "Authenticate" button. Clicking "Authenticate" invokes onStartScan.
 */
export default function OnboardingInstructions({ onStartScan }) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Smooth progress simulation from 0 to 100%
    const duration = 2400; // ~2.4s
    const stepTime = 40;
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentPct);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setTimeout(() => {
          setIsCompleted(true);
        }, 200);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="onboarding-overlay">
      {/* Background scrim showing the scanner background behind it */}
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
                width="64"
                height="64"
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

        {/* Bottom Section: Progress bar or Authenticate button */}
        <div className="onboarding-bottom-action">
          {!isCompleted ? (
            <div className="onboarding-progress-container">
              <div className="onboarding-progress-text">
                Loading... Please wait. {progress}%
              </div>
              <div className="onboarding-progress-track">
                <div
                  className="onboarding-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="onboarding-auth-btn"
              onClick={onStartScan}
              id="onboarding-authenticate-button"
            >
              Authenticate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
