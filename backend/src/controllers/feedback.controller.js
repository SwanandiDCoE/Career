const feedbackService = require('../services/feedback.service');
const response        = require('../utils/response');
const logger          = require('../utils/logger');

/**
 * POST /api/feedback
 * Body: { resume_text: string }
 *
 * Accepts raw resume text (already extracted from PDF on the client
 * or from a previous upload call) and returns structured feedback.
 */
exports.getResumeFeedback = async (req, res, next) => {
  try {
    const { resume_text } = req.body;

    // ── Validate ──────────────────────────────────────────────
    if (!resume_text || typeof resume_text !== 'string') {
      return response.badRequest(res, 'resume_text is required (string)');
    }
    if (resume_text.trim().length < 50) {
      return response.badRequest(res, 'resume_text is too short. Please provide the full resume content.');
    }

    logger.info(`feedback → analysing ${resume_text.length} chars`);

    const feedback = await feedbackService.generate(resume_text);

    return response.ok(res, feedback, 'Feedback generated successfully');
  } catch (err) {
    next(err);
  }
};
