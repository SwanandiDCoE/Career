const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the upload pipeline.
 * 10 uploads per 15 minutes per IP — generous for a hackathon demo,
 * restrictive enough to prevent abuse.
 */
const uploadLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: 'Too many upload requests. Please wait 15 minutes before trying again.',
  },
});

/**
 * Rate limiter for AI generation endpoints.
 * 30 requests per minute per IP.
 */
const generateLimiter = rateLimit({
  windowMs:        60 * 1000,      // 1 minute
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: 'Too many generation requests. Please slow down.',
  },
});

module.exports = { uploadLimiter, generateLimiter };
