const { openai, MODEL }  = require('../config/openai');
const { DUMMY_FEEDBACK } = require('../utils/dummy');
const prompts            = require('../utils/prompts');
const logger             = require('../utils/logger');

const USE_AI = process.env.USE_AI === 'true';

/**
 * Generate structured resume feedback.
 * Returns OpenAI analysis when USE_AI=true, dummy data otherwise.
 */
exports.generate = async (resumeText) => {
  if (!USE_AI) {
    logger.info('feedback.generate → using dummy data (USE_AI=false)');
    return DUMMY_FEEDBACK;
  }

  logger.info('feedback.generate → calling OpenAI');

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    messages: [
      { role: 'system', content: prompts.FEEDBACK_SYSTEM },
      { role: 'user',   content: prompts.feedbackUser(resumeText) },
    ],
  });

  const feedback = JSON.parse(completion.choices[0].message.content);

  return {
    overall_score: Math.min(100, Math.max(0, Number(feedback.overall_score) || 50)),
    strengths:     Array.isArray(feedback.strengths)    ? feedback.strengths    : [],
    suggestions:   Array.isArray(feedback.suggestions)  ? feedback.suggestions  : [],
    ats_tips:      Array.isArray(feedback.ats_tips)     ? feedback.ats_tips     : [],
  };
};
