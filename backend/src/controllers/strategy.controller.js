const strategyService = require('../services/strategy.service');
const response        = require('../utils/response');
const logger          = require('../utils/logger');

/**
 * POST /api/strategy
 *
 * Generate a full Apply Strategy for one specific job.
 *
 * Body:
 * {
 *   resume_text: string,           // raw text from PDF (required)
 *   job: {
 *     title:       string,         // required
 *     company:     string,         // required
 *     location?:   string,
 *     description: string,         // strongly recommended — quality drops without it
 *     job_url?:    string
 *   }
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     match_score:          number,
 *     match_summary:        string,
 *     strengths:            string[],
 *     missing_skills:       MissingSkill[],
 *     improvement_actions:  ImprovementAction[],
 *     interview_tips:       InterviewTip[],
 *     application_priority: 'apply_now' | 'apply_after_improvements' | 'long_term_goal',
 *     priority_reason:      string
 *   }
 * }
 */
exports.generateStrategy = async (req, res, next) => {
  try {
    const { resume_text, job } = req.body;

    // ── Input validation ──────────────────────────────────────
    if (!resume_text || typeof resume_text !== 'string') {
      return response.badRequest(res, 'resume_text is required (the raw text from the candidate\'s PDF)');
    }
    if (resume_text.trim().length < 100) {
      return response.badRequest(res, 'resume_text is too short — please provide the full resume content (min 100 chars)');
    }
    if (!job || typeof job !== 'object') {
      return response.badRequest(res, 'job object is required');
    }
    if (!job.title?.trim()) {
      return response.badRequest(res, 'job.title is required');
    }
    if (!job.company?.trim()) {
      return response.badRequest(res, 'job.company is required');
    }

    // Warn if no description — strategy quality degrades significantly
    if (!job.description?.trim() && !job.job_url?.trim()) {
      logger.warn(`strategy: no job description provided for "${job.title}" at "${job.company}" — output quality may be reduced`);
    }

    logger.info(`strategy → "${job.title}" at "${job.company}" | resume: ${resume_text.length} chars`);

    const strategy = await strategyService.generate(resume_text.trim(), {
      title:       job.title.trim(),
      company:     job.company.trim(),
      location:    job.location?.trim()    || '',
      description: job.description?.trim() || '',
      job_url:     job.job_url?.trim()     || '',
    });

    return response.ok(res, strategy, 'Apply strategy generated');
  } catch (err) {
    next(err);
  }
};
