const generateService = require('../services/generate.service');

/**
 * POST /api/generate/cold-email
 * Body: { match: JobMatch, profile_summary: string }
 */
exports.coldEmail = async (req, res, next) => {
  try {
    const { match, profile_summary } = req.body;
    if (!match || !profile_summary) {
      return res.status(400).json({ error: 'match and profile_summary are required.' });
    }
    const email = await generateService.coldEmail(match, profile_summary);
    res.json({ email });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/generate/linkedin-post
 * Body: { profile_summary, target_role }
 */
exports.linkedInPost = async (req, res, next) => {
  try {
    const { profile_summary, target_role } = req.body;
    if (!profile_summary || !target_role) {
      return res.status(400).json({ error: 'profile_summary and target_role are required.' });
    }
    const post = await generateService.linkedInPost(profile_summary, target_role);
    res.json({ post });
  } catch (err) {
    next(err);
  }
};
