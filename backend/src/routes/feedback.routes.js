const express             = require('express');
const router              = express.Router();
const feedbackController  = require('../controllers/feedback.controller');

/**
 * POST /api/feedback
 * Body: { resume_text: string }
 *
 * Returns structured resume feedback.
 */
router.post('/', feedbackController.getResumeFeedback);

module.exports = router;
