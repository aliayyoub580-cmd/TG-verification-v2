const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const verifyRouter = require('./routes/verify');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const qrCodesRouter = require('./routes/qrCodes');
const scansRouter = require('./routes/scans');
const newsRouter = require('./routes/news');
const cronRouter = require('./routes/cron');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust Vercel/Cloudflare reverse proxy for correct IP

// ─── Legacy Domain 301 Redirect ───────────────────────────────────────────────
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.includes('tg-verification-xi.vercel.app')) {
    return res.redirect(301, `https://tg-verification-v2.vercel.app${req.originalUrl}`);
  }
  next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Supabase Storage images
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_VERIFICATION_BASE_URL,
  'https://tg-verification-v2.vercel.app',
  'https://tg-verification-xi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Mobile apps, server-to-server, curl, Postman
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    // Allow all Vercel domains (*.vercel.app)
    if (hostname.endsWith('.vercel.app')) return true;
    // Allow local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch (err) {
    return false;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Indufar QR Verification API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/verify', verifyRouter);
app.use('/api/admin/auth', authRouter);
app.use('/api/admin/products', productsRouter);
app.use('/api/admin/qr-codes', qrCodesRouter);
app.use('/api/admin/scans', scansRouter);
app.use('/api/admin/news', newsRouter);
app.use('/api/cron', cronRouter);

// ─── Static files (production / unified mode) ───────────────────────────────
const fs = require('fs');
const distPath = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── 404 handler for unmatched API routes ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Central error handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
