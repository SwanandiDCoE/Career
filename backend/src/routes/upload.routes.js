const express          = require('express');
const router           = express.Router();
const upload           = require('../config/multer');
const uploadController = require('../controllers/upload.controller');
const { uploadLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/upload
 *
 * Multipart form-data:
 *   - resume    (file, PDF required)
 *   - job_title (string, required)
 *   - location  (string, optional — defaults to "Remote")
 *
 * Returns: { success, data: { profile, matches, feedback }, message }
 */
router.post(
  '/',
  uploadLimiter,               // 10 uploads per 15 min per IP
  upload.single('resume'),     // multer handles file parsing
  uploadController.handleUpload
);

module.exports = router;
