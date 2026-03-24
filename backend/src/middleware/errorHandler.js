const logger = require('../utils/logger');

/**
 * Global Express error handler.
 *
 * Any route/controller that calls next(err) lands here.
 * Returns a consistent JSON error envelope so the frontend
 * always knows how to handle failures.
 */
const errorHandler = (err, req, res, _next) => {
  logger.error(`${req.method} ${req.path} → ${err.message}`);

  // ── Multer errors ─────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`,
    });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ success: false, error: err.message });
  }

  // ── OpenAI rate limit ─────────────────────────────────────────
  if (err?.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'AI service is rate-limited. Please wait a moment and try again.',
    });
  }

  // ── OpenAI auth error ─────────────────────────────────────────
  if (err?.status === 401) {
    return res.status(500).json({
      success: false,
      error: 'AI service authentication failed. Check your OPENAI_API_KEY.',
    });
  }

  // ── Python service unreachable ────────────────────────────────
  if (err?.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Job fetching service is currently unavailable. Try again shortly.',
    });
  }

  // ── Axios network error ───────────────────────────────────────
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'Downstream service timed out. Please try again.',
    });
  }

  // ── PDF parse errors ──────────────────────────────────────────
  if (err.message?.toLowerCase().includes('pdf')) {
    return res.status(422).json({ success: false, error: err.message });
  }

  // ── Default ───────────────────────────────────────────────────
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error:   err.message || 'An unexpected error occurred. Please try again.',
  });
};

module.exports = errorHandler;
