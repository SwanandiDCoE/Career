const aiService = require('../services/ai.service');
const response  = require('../utils/response');
const logger    = require('../utils/logger');

// ── Cold Email ────────────────────────────────────────────────────

/**
 * POST /api/email
 * Body: {
 *   job: { title, company, job_url },
 *   matched_skills: string[],
 *   profile_summary: string   (e.g. "2 years React/Node.js experience, B.Tech CSE")
 * }
 */
exports.generateEmail = async (req, res, next) => {
  try {
    const { job, matched_skills, profile_summary } = req.body;

    // ── Validate ──────────────────────────────────────────────
    if (!job || !job.title) {
      return response.badRequest(res, 'job.title is required');
    }
    if (!job.company) {
      return response.badRequest(res, 'job.company is required');
    }
    if (!profile_summary || profile_summary.trim().length < 10) {
      return response.badRequest(res, 'profile_summary is required (describe the candidate briefly)');
    }

    const skills = Array.isArray(matched_skills) ? matched_skills : [];

    logger.info(`generateEmail → ${job.title} at ${job.company}`);

    const email = await aiService.generateColdEmail(job, skills, profile_summary.trim());

    return response.ok(res, { email }, 'Cold email generated');
  } catch (err) {
    next(err);
  }
};

// ── LinkedIn Post ─────────────────────────────────────────────────

/**
 * POST /api/linkedin
 * Body: {
 *   profile: { name, target_role, skills, experience_years },
 *   tone?: 'professional' | 'authentic' | 'bold'
 * }
 */
exports.generateLinkedIn = async (req, res, next) => {
  try {
    const { profile, tone = 'authentic' } = req.body;

    // ── Validate ──────────────────────────────────────────────
    if (!profile || typeof profile !== 'object') {
      return response.badRequest(res, 'profile is required');
    }
    if (!profile.target_role) {
      return response.badRequest(res, 'profile.target_role is required');
    }
    if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
      return response.badRequest(res, 'profile.skills must be a non-empty array');
    }

    const validTones = ['professional', 'authentic', 'bold'];
    const useTone    = validTones.includes(tone) ? tone : 'authentic';

    logger.info(`generateLinkedIn → role: "${profile.target_role}", tone: "${useTone}"`);

    const post = await aiService.generateLinkedInPost(profile, useTone);

    return response.ok(res, { post }, 'LinkedIn post generated');
  } catch (err) {
    next(err);
  }
};
