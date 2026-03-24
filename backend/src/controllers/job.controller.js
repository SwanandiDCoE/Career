const jobService      = require('../services/job.service');
const strategyService = require('../services/strategy.service');
const response        = require('../utils/response');
const logger          = require('../utils/logger');

/**
 * GET /api/jobs
 * Query params: job_title, location, results_wanted
 *
 * Returns raw job listings (unscored).
 */
exports.getJobs = async (req, res, next) => {
  try {
    const { job_title = 'Software Engineer', location = 'Remote', results_wanted = 20 } = req.query;

    logger.info(`getJobs → title: "${job_title}", location: "${location}"`);

    const jobs = await jobService.fetchJobs(job_title, location, Number(results_wanted));

    return response.ok(res, { jobs, count: jobs.length });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/job-match
 * Body: { profile, job, resume_text? }
 *
 * Scores a single job against a profile.
 * If resume_text is provided, also runs the Apply Strategy Engine
 * and returns both match + strategy in one call — saves a round-trip.
 */
exports.matchJob = async (req, res, next) => {
  try {
    const { profile, job, resume_text } = req.body;

    // ── Validate ──────────────────────────────────────────────
    if (!profile || typeof profile !== 'object') {
      return response.badRequest(res, 'profile is required (object with skills, experience_years, etc.)');
    }
    if (!job || !job.title) {
      return response.badRequest(res, 'job is required with at least a title field');
    }
    if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
      return response.badRequest(res, 'profile.skills must be a non-empty array');
    }

    const hasResumeText = resume_text && typeof resume_text === 'string' && resume_text.trim().length >= 100;

    logger.info(`matchJob → "${job.title}" at "${job.company || 'unknown'}"${hasResumeText ? ' + strategy' : ''}`);

    // Run match + strategy in parallel when resume_text is provided
    if (hasResumeText) {
      const [match, strategy] = await Promise.all([
        jobService.matchOne(profile, job),
        strategyService.generate(resume_text.trim(), job),
      ]);
      return response.ok(res, { match, strategy });
    }

    const match = await jobService.matchOne(profile, job);
    return response.ok(res, { match });
  } catch (err) {
    next(err);
  }
};
