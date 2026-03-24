const express       = require('express');
const router        = express.Router();
const aiController  = require('../controllers/ai.controller');
const { generateLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/email
 * Body: { job, matched_skills, profile_summary }
 *
 * Generates a personalised cold email for a specific job application.
 */
router.post('/email', generateLimiter, aiController.generateEmail);

/**
 * POST /api/linkedin
 * Body: { profile, tone? }
 *
 * Generates an optimised LinkedIn "open to work" post.
 */
router.post('/linkedin', generateLimiter, aiController.generateLinkedIn);

module.exports = router;
