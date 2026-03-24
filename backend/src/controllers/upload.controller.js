const fs              = require('fs');
const resumeService   = require('../services/resume.service');
const jobService      = require('../services/job.service');
const feedbackService = require('../services/feedback.service');
const response        = require('../utils/response');
const logger          = require('../utils/logger');

/**
 * POST /api/upload
 *
 * Full pipeline triggered by a single file upload:
 *   1. Extract text from PDF
 *   2. Parse profile with AI (or dummy)
 *   3. Fetch live jobs (or dummy)
 *   4. Score each job against profile (parallel)
 *   5. Generate resume feedback
 *
 * Returns the complete AnalysisResult that the frontend dashboard uses.
 */
exports.handleUpload = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    // ── Validate request ──────────────────────────────────────
    if (!req.file) {
      return response.badRequest(res, 'No PDF file uploaded. Please attach a file with the key "resume".');
    }

    const { job_title, location } = req.body;

    if (!job_title?.trim()) {
      return response.badRequest(res, 'job_title is required. Tell us what role you are targeting.');
    }

    logger.info(`Upload received: "${req.file.originalname}" → role: "${job_title}", location: "${location || 'not specified'}"`);

    // ── Step 1: Extract PDF text ──────────────────────────────
    const pdfBuffer  = fs.readFileSync(filePath);
    const resumeText = await resumeService.extractText(pdfBuffer);

    // ── Step 2: Parse into structured profile ─────────────────
    const profile = await resumeService.parseProfile(resumeText, job_title.trim());

    // ── Steps 3 & 5: Fetch jobs and generate feedback in parallel
    // Pass profile.skills so DB query filters by actual candidate skills
    const [rawJobs, feedback] = await Promise.all([
      jobService.fetchJobs(job_title.trim(), location?.trim() || 'Remote', profile.skills || []),
      feedbackService.generate(resumeText),
    ]);

    // ── Step 4: Score jobs against profile ───────────────────
    const matches = await jobService.scoreJobs(profile, rawJobs);

    logger.info(`Analysis complete: ${matches.length} matches scored, resume score: ${feedback.overall_score}`);

    // ── Cleanup uploaded file ─────────────────────────────────
    _cleanupFile(filePath);

    return response.ok(res, { profile, matches, feedback }, 'Resume analysis complete');
  } catch (err) {
    _cleanupFile(filePath);
    next(err);
  }
};

function _cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      logger.warn(`Could not delete uploaded file: ${filePath}`);
    }
  }
}
