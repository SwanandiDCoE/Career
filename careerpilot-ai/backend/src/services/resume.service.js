const pdfParse = require('pdf-parse');
const { openai, MODEL } = require('../config/openai');
const { DUMMY_PROFILE }  = require('../utils/dummy');
const prompts            = require('../utils/prompts');
const { parseResume }    = require('../utils/resumeParser');
const logger             = require('../utils/logger');

const USE_AI = process.env.USE_AI === 'true';

/**
 * Extract raw text from a PDF buffer using pdf-parse.
 * Always runs — we need the text even in dummy mode for word count etc.
 */
exports.extractText = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim();
    if (!text || text.length < 50) {
      throw new Error('PDF appears to be empty or image-only. Please use a text-based PDF.');
    }
    logger.info(`PDF parsed — ${text.length} characters extracted`);
    return text;
  } catch (err) {
    // Re-throw with a friendlier message if it's a parse failure
    if (err.message.includes('PDF')) throw err;
    throw new Error('Could not read the PDF file. Make sure it is not encrypted or corrupted.');
  }
};

/**
 * Parse resume text → structured profile.
 * Uses OpenAI when USE_AI=true, otherwise returns enriched dummy data.
 */
exports.parseProfile = async (resumeText, targetRole) => {
  if (!USE_AI) {
    logger.info('parseProfile → regex parser (no API key needed)');
    const profile = parseResume(resumeText, targetRole);
    logger.info(`parseProfile → extracted ${profile.skills.length} skills, ${profile.experience_years} yrs exp`);
    return profile;
  }

  logger.info('parseProfile → calling OpenAI');

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.1, // Low temp — we want deterministic extraction
    messages: [
      { role: 'system', content: prompts.RESUME_PARSER_SYSTEM },
      { role: 'user',   content: prompts.resumeParserUser(resumeText, targetRole) },
    ],
  });

  const profile = JSON.parse(completion.choices[0].message.content);

  // Ensure required fields exist
  return {
    name:             profile.name             || 'Candidate',
    email:            profile.email            || '',
    skills:           Array.isArray(profile.skills) ? profile.skills : [],
    experience_years: Number(profile.experience_years) || 0,
    education:        profile.education        || '',
    target_role:      profile.target_role      || targetRole,
  };
};
