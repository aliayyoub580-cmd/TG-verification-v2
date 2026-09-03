const { verifyProductCode } = require('../services/verifyProductCode');
const { verifyCode: legacyVerifyCode } = require('../services/verifyService');

/**
 * Handles product verification requests.
 * - POST /api/verify { code: "XYZ" } -> Modern iOS App Clip endpoint returning { authentic, productName, batch, message }
 * - GET /api/verify?code=XYZ -> Backward-compatible endpoint returning status (authentic, inactive, not_found)
 */
async function verify(req, res, next) {
  try {
    const isPost = req.method === 'POST';
    const rawCode = isPost ? req.body?.code : req.query?.code;

    const meta = {
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      referrer: req.headers.referer || req.headers.referrer || null,
    };

    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return res.status(400).json({
        authentic: false,
        success: false,
        status: 'missing_code',
        message: 'Product code is required for verification.',
      });
    }

    if (isPost) {
      // Modern iOS App Clip response structure:
      // { "authentic": true, "productName": "...", "batch": "...", "message": "..." }
      const result = await verifyProductCode(rawCode, meta);
      return res.status(200).json(result);
    }

    // GET /api/verify?code=... (Existing legacy endpoint)
    const result = await legacyVerifyCode(rawCode, meta);
    const statusCode =
      result.status === 'authentic' || result.status === 'inactive' ? 200 :
      result.status === 'error' ? 503 :
      result.status === 'not_found' ? 404 : 400;

    return res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { verify };
