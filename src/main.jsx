import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import './styles/admin.css';

// Prevent zoom across all platforms (Android, iPhone, Laptop/Desktop)
if (typeof window !== 'undefined') {
  // 1. Prevent Ctrl/Cmd + wheel zoom and pinch-to-zoom on laptop trackpads
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 2. Prevent keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '0', '=')
  window.addEventListener(
    'keydown',
    (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' ||
          e.key === '-' ||
          e.key === '=' ||
          e.key === '_' ||
          e.key === '0' ||
          e.keyCode === 187 ||
          e.keyCode === 189 ||
          e.keyCode === 107 ||
          e.keyCode === 109 ||
          e.keyCode === 96 ||
          e.keyCode === 48)
      ) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 3. Prevent Safari / iOS gesturezoom (pinch to zoom)
  document.addEventListener(
    'gesturestart',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener(
    'gesturechange',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener(
    'gestureend',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // 4. Prevent mobile multi-touch pinch zooming
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 5. Prevent double-tap to zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
