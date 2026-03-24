const express             = require('express');
const router              = express.Router();
const jobController       = require('../controllers/job.controller');
const strategyController  = require('../controllers/strategy.controller');
const { generateLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/jobs
 * Query: job_title, location, results_wanted
 * Returns raw job listings (unscored).
 */
router.get('/', jobController.getJobs);

/**
 * POST /api/job-match
 * Body: { profile, job }
 * Scores a single job against a profile.
 * Also returns a strategy object when resume_text is provided.
 *
 * Extended body (to get strategy in same call):
 *   { profile, job, resume_text? }
 */
router.post('/job-match', jobController.matchJob);

/**
 * POST /api/strategy
 * Body: { resume_text, job }
 *
 * The Apply Strategy Engine — generates:
 *   match_score, strengths, missing_skills,
 *   improvement_actions, interview_tips, application_priority
 *
 * This is a heavier AI call — rate-limited to 30/min.
 */
router.post('/strategy', generateLimiter, strategyController.generateStrategy);

module.exports = router;
