import React from 'react';

/**
 * SirenIcon
 * Pixel-perfect red emergency beacon light matching the Apple 3D siren emoji / screenshot:
 * - Shiny red cylindrical dome with Fresnel lens horizontal ridges
 * - Central 4-point star lens flare with glowing radial halo
 * - Brushed chrome / silver metallic base ring with rim reflection and drop shadow
 */
export function SirenIcon({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="counterfeit-siren-svg"
      role="img"
      aria-label="Counterfeit product emergency alert"
    >
      <defs>
        {/* 3D Red Beacon Dome Gradient */}
        <radialGradient id="sirenDomeGrad" cx="42%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#ff5252" />
          <stop offset="38%" stopColor="#e51c23" />
          <stop offset="78%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#7f0000" />
        </radialGradient>

        {/* Glossy Curved Highlight for Left Dome */}
        <linearGradient id="sirenGlossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#ff8a80" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d50000" stopOpacity="0" />
        </linearGradient>

        {/* Metallic Chrome Base Gradient */}
        <linearGradient id="chromeBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="22%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="78%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Lower Rim Gradient */}
        <linearGradient id="chromeRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="30%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Intense Flare Halo */}
        <radialGradient id="sirenFlareHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#ffcdd2" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#f44336" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#d32f2f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground cast shadow */}
      <ellipse cx="32" cy="59.5" rx="20" ry="3.5" fill="rgba(0, 0, 0, 0.2)" />

      {/* Chrome Base lower lip / flange */}
      <path
        d="M16 52 C16 49.5 48 49.5 48 52 L47.2 56.5 C47.2 58.8 16.8 58.8 16.8 56.5 Z"
        fill="url(#chromeRimGrad)"
      />

      {/* Chrome Base main body */}
      <path
        d="M17.2 47.5 C17.2 45.2 46.8 45.2 46.8 47.5 L47.8 53 C47.8 55.4 16.2 55.4 16.2 53 Z"
        fill="url(#chromeBaseGrad)"
      />

      {/* Red Siren Dome Body */}
      <path
        d="M20 47.5 C18 47.5 17.2 38 17.6 28 C18.1 18.5 24.2 13.5 32 13.5 C39.8 13.5 45.9 18.5 46.4 28 C46.8 38 46 47.5 44 47.5 Z"
        fill="url(#sirenDomeGrad)"
      />

      {/* Fresnel Lens Horizontal Ridges */}
      <path d="M18.2 23.5 C23 25.5 41 25.5 45.8 23.5" stroke="rgba(255, 255, 255, 0.28)" strokeWidth="1.4" fill="none" />
      <path d="M17.6 30.5 C23 32.8 41 32.8 46.4 30.5" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.4" fill="none" />
      <path d="M17.9 37.5 C23 39.8 41 39.8 46.1 37.5" stroke="rgba(0, 0, 0, 0.22)" strokeWidth="1.4" fill="none" />
      <path d="M18.8 43.8 C23 45.8 41 45.8 45.2 43.8" stroke="rgba(0, 0, 0, 0.28)" strokeWidth="1.4" fill="none" />

      {/* Glossy Top Curve Reflection */}
      <ellipse cx="31.5" cy="17.5" rx="8" ry="3" fill="rgba(255, 255, 255, 0.4)" />

      {/* Glossy Left Edge Highlight */}
      <path
        d="M21 16.5 C24.5 15 29 14.5 32 14.5 C26 14.5 20.8 19 20.2 27 C19.6 33.5 20 41.5 21 45.5 C19.8 41.5 19 33.5 19.5 27 C20 20 20.5 17.5 21 16.5 Z"
        fill="url(#sirenGlossGrad)"
      />

      {/* Center Light Flare Glow */}
      <circle cx="31" cy="29" r="14.5" fill="url(#sirenFlareHalo)" />

      {/* 4-Point Diamond Sparkle Star */}
      {/* Horizontal beam */}
      <path d="M17 29 Q31 27.8 45 29 Q31 30.2 17 29 Z" fill="#ffffff" opacity="0.95" />
      {/* Vertical beam */}
      <path d="M31 15 Q29.8 29 31 43 Q32.2 29 31 15 Z" fill="#ffffff" opacity="0.95" />
      {/* Diagonal rays */}
      <path d="M21 19 Q31 29 41 39 Q31 29 21 19 Z" fill="#ffffff" opacity="0.65" />
      <path d="M41 19 Q31 29 21 39 Q31 29 41 19 Z" fill="#ffffff" opacity="0.65" />
      {/* Diamond Core */}
      <circle cx="31" cy="29" r="2.8" fill="#ffffff" />
    </svg>
  );
}

/**
 * CounterfeitModal
 * Disclaimer popup shown when:
 * 1. Scanned QR code does not match in the database
 * 2. User taps the "Stop" button in the scanner
 *
 * Matches the reference design exactly:
 * - Centered white card with 26px rounded corners
 * - 3D siren emergency beacon graphic
 * - "Counterfeit product" title
 * - Explicit 3-line warning copy
 * - Pill-shaped "Understood" button with gradient #3d81f2 -> #a755f8
 */
export default function CounterfeitModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="counterfeit-modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="counterfeit-title"
      aria-describedby="counterfeit-desc"
    >
      <div
        className="counterfeit-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Siren Beacon Icon */}
        <div className="counterfeit-icon-wrap">
          <SirenIcon size={56} />
        </div>

        {/* Title */}
        <h2 id="counterfeit-title" className="counterfeit-modal-title">
          Counterfeit product
        </h2>

        {/* Warning Body Text - Explicit 3 distinct lines matching reference screenshot */}
        <p id="counterfeit-desc" className="counterfeit-modal-desc">
          <span className="counterfeit-line">This product has been identified as counterfeit. Do</span>
          <span className="counterfeit-line">not use or consume it, and report it to the</span>
          <span className="counterfeit-line">manufacturer or the point of sale.</span>
        </p>

        {/* Understood Button */}
        <button
          type="button"
          className="counterfeit-modal-btn"
          onClick={onClose}
          id="counterfeit-understood-btn"
          autoFocus
        >
          Understood
        </button>
      </div>
    </div>
  );
}

