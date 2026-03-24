const { openai, MODEL }       = require('../config/openai');
const { DUMMY_STRATEGY }      = require('../utils/dummy');
const prompts                 = require('../utils/prompts');
const logger                  = require('../utils/logger');

const USE_AI = process.env.USE_AI === 'true';

/**
 * Generate a full Apply Strategy for a candidate + job pair.
 *
 * @param {string} resumeText  - Raw text extracted from the candidate's PDF
 * @param {object} job         - { title, company, location, description, job_url }
 * @returns {ApplyStrategy}    - Structured strategy object
 */
exports.generate = async (resumeText, job) => {
  if (!USE_AI) {
    logger.info('strategy.generate → returning dummy strategy (USE_AI=false)');
    // Personalise the dummy slightly with real job info
    return {
      ...DUMMY_STRATEGY,
      match_summary: `Based on your resume, you are a ${DUMMY_STRATEGY.match_score >= 75 ? 'strong' : 'partial'} fit for the ${job.title} role at ${job.company}. ${DUMMY_STRATEGY.match_summary.split('.')[1]?.trim() || ''}`,
    };
  }

  logger.info(`strategy.generate → calling OpenAI for "${job.title}" at "${job.company}"`);

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.3,   // Low — we want precise, not creative
    max_tokens: 2000,   // Enough for full strategy, avoids runaway cost
    messages: [
      { role: 'system', content: prompts.STRATEGY_SYSTEM },
      { role: 'user',   content: prompts.strategyUser(resumeText, job) },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content);

  // ── Normalise and validate output ────────────────────────────
  return _normalise(raw, job);
};

/**
 * Normalise raw GPT output into a guaranteed-safe shape.
 * Prevents frontend crashes if GPT skips optional fields.
 */
function _normalise(raw, job) {
  return {
    match_score:          Math.min(100, Math.max(0, Number(raw.match_score) || 50)),
    match_summary:        raw.match_summary         || `Analysis for ${job.title} at ${job.company}.`,
    strengths:            Array.isArray(raw.strengths) ? raw.strengths.slice(0, 4) : [],
    missing_skills:       _normaliseMissingSkills(raw.missing_skills),
    improvement_actions:  _normaliseActions(raw.improvement_actions),
    interview_tips:       _normaliseTips(raw.interview_tips),
    application_priority: ['apply_now', 'apply_after_improvements', 'long_term_goal'].includes(raw.application_priority)
                            ? raw.application_priority
                            : 'apply_after_improvements',
    priority_reason:      raw.priority_reason || '',
  };
}

function _normaliseMissingSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.slice(0, 5).map((s) => ({
    skill:      typeof s === 'string' ? s : (s.skill || 'Unknown skill'),
    importance: ['critical', 'important', 'nice-to-have'].includes(s.importance) ? s.importance : 'important',
    context:    s.context || '',
  }));
}

function _normaliseActions(actions) {
  if (!Array.isArray(actions)) return [];
  const validTypes = ['resume_edit', 'skill_to_learn', 'project_to_build'];
  return actions.slice(0, 6).map((a) => ({
    type:   validTypes.includes(a.type) ? a.type : 'resume_edit',
    action: a.action || '',
    impact: a.impact === 'high' ? 'high' : 'medium',
  }));
}

function _normaliseTips(tips) {
  if (!Array.isArray(tips)) return [];
  return tips.slice(0, 4).map((t) => ({
    likely_question: t.likely_question || '',
    why_they_ask:    t.why_they_ask    || '',
    how_to_answer:   t.how_to_answer   || '',
  }));
}
