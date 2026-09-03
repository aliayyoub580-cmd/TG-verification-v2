const express = require('express');
const rateLimit = require('express-rate-limit');
const { verify } = require('../controllers/verifyController');
const {
  PUBLIC_VERIFY_WINDOW_MS,
  PUBLIC_VERIFY_MAX_REQUESTS,
} = require('../config/constants');

const router = express.Router();

// Rate limit — 30 requests per minute per IP to protect against brute force
const verifyLimiter = rateLimit({
  windowMs: PUBLIC_VERIFY_WINDOW_MS || 60 * 1000,
  max: PUBLIC_VERIFY_MAX_REQUESTS || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    authentic: false,
    success: false,
    message: 'Too many verification requests. Please wait a moment and try again.',
  },
  keyGenerator: (req) => req.ip,
});

/**
 * POST /api/verify
 * Body: { code: "VALID-TG-001" }
 * Primary endpoint for mobile App Clip QR/barcode scanner
 */
router.post('/', verifyLimiter, verify);

/**
 * GET /api/verify?code=7GG6Y89U8K
 * Public GET endpoint for direct link access and backwards compatibility
 */
router.get('/', verifyLimiter, verify);

module.exports = router;
