const { openai, MODEL }                       = require('../config/openai');
const { DUMMY_COLD_EMAIL, DUMMY_LINKEDIN_POST } = require('../utils/dummy');
const prompts                                   = require('../utils/prompts');
const logger                                    = require('../utils/logger');

const USE_AI = process.env.USE_AI === 'true';

// ── Cold Email ────────────────────────────────────────────────────

/**
 * Generate a personalised cold email for a job application.
 *
 * @param {object} job            - { title, company, job_url }
 * @param {string[]} matchedSkills
 * @param {string} profileSummary - Short summary of the candidate
 */
exports.generateColdEmail = async (job, matchedSkills, profileSummary) => {
  if (!USE_AI) {
    logger.info('generateColdEmail → using dummy data');
    const topSkill = matchedSkills?.[0] || 'React';
    return DUMMY_COLD_EMAIL(job.title, job.company, topSkill);
  }

  logger.info(`generateColdEmail → calling OpenAI for ${job.company}`);

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.7, // A bit of creativity for emails
    messages: [
      { role: 'system', content: prompts.COLD_EMAIL_SYSTEM },
      { role: 'user',   content: prompts.coldEmailUser(job.title, job.company, matchedSkills, profileSummary) },
    ],
  });

  return completion.choices[0].message.content.trim();
};

// ── LinkedIn Post ─────────────────────────────────────────────────

/**
 * Generate an optimised LinkedIn "open to work" post.
 *
 * @param {object} profile - { name, target_role, skills, experience_years }
 * @param {string} tone    - 'professional' | 'authentic' | 'bold'
 */
exports.generateLinkedInPost = async (profile, tone = 'authentic') => {
  if (!USE_AI) {
    logger.info('generateLinkedInPost → using dummy data');
    return DUMMY_LINKEDIN_POST(profile.name, profile.target_role, profile.skills);
  }

  logger.info('generateLinkedInPost → calling OpenAI');

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.8, // More creative for social content
    messages: [
      { role: 'system', content: prompts.LINKEDIN_POST_SYSTEM },
      {
        role: 'user',
        content: prompts.linkedInPostUser(
          profile.name,
          profile.target_role,
          profile.skills,
          profile.experience_years,
          tone
        ),
      },
    ],
  });

  return completion.choices[0].message.content.trim();
};
