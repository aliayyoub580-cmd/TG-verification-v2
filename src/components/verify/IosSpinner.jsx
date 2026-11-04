import React from 'react';

/**
 * IosSpinner
 * Classic iOS 8-spoke Activity Indicator matching uploaded reference image
 */
export default function IosSpinner({ size = 42, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      className="ios-spoke-spinner"
      aria-hidden="true"
    >
      <g stroke={color} strokeWidth="3.6" strokeLinecap="round">
        <line x1="22" y1="5" x2="22" y2="11" opacity="1.0" />
        <line x1="34.02" y1="9.98" x2="29.78" y2="14.22" opacity="0.875" />
        <line x1="39" y1="22" x2="33" y2="22" opacity="0.75" />
        <line x1="34.02" y1="34.02" x2="29.78" y2="29.78" opacity="0.625" />
        <line x1="22" y1="39" x2="22" y2="33" opacity="0.5" />
        <line x1="9.98" y1="34.02" x2="14.22" y2="29.78" opacity="0.375" />
        <line x1="5" y1="22" x2="11" y2="22" opacity="0.25" />
        <line x1="9.98" y1="9.98" x2="14.22" y2="14.22" opacity="0.125" />
      </g>
    </svg>
  );
}

