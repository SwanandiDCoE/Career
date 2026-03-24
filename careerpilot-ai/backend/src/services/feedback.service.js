const { openai, MODEL }  = require('../config/openai');
const { DUMMY_FEEDBACK } = require('../utils/dummy');
const prompts            = require('../utils/prompts');
const { parseResume }    = require('../utils/resumeParser');
const logger             = require('../utils/logger');

const USE_AI = process.env.USE_AI === 'true';

function _heuristicFeedback(resumeText) {
  const text    = resumeText.toLowerCase();
  const len     = resumeText.length;
  const lines   = resumeText.split('\n').filter(l => l.trim());
  const profile = parseResume(resumeText, '');

  const strengths  = [];
  const suggestions = [];
  const ats_tips   = [];

  // Strengths
  if (profile.skills.length >= 8)
    strengths.push(`Strong technical profile with ${profile.skills.length} identified skills including ${profile.skills.slice(0,3).join(', ')}`);
  if (profile.email)
    strengths.push('Contact information is clearly present and well-formatted');
  if (profile.experience_years > 0)
    strengths.push(`${profile.experience_years} year(s) of experience detected — work history is present`);
  if (strengths.length === 0)
    strengths.push('Resume has clear section structure');

  // Suggestions
  if (profile.skills.length < 6)
    suggestions.push('Add a dedicated Skills section listing all your technical tools and languages');
  if (len < 1500)
    suggestions.push('Resume seems short — add more detail to your experience bullets with measurable outcomes (e.g. "Reduced load time by 30%")');
  if (!/\d+%|\d+x|\$\d+|\d+ (users|requests|ms|seconds|hours|days)/i.test(resumeText))
    suggestions.push('Add quantified impact to every experience bullet — numbers make recruiters stop scrolling');
  if (!/github|gitlab|portfolio|linkedin/i.test(resumeText))
    suggestions.push('Add links to your GitHub and LinkedIn — ATS systems and recruiters both look for these');
  if (!/summary|objective|profile/i.test(text))
    suggestions.push('Add a 2-line professional summary at the top tailored to your target role');

  // ATS tips
  if (/table|column/i.test(resumeText) || lines.some(l => l.includes('|')))
    ats_tips.push('Avoid tables or columns — ATS parsers often misread them as garbled text');
  ats_tips.push('Use standard section headers: "Experience", "Education", "Skills" — not creative labels');
  if (profile.skills.length > 0)
    ats_tips.push(`Mirror keywords from job descriptions in your skills section — you already have ${profile.skills.slice(0,3).join(', ')} which is a good start`);

  const score = Math.min(95, Math.max(35,
    40
    + Math.min(profile.skills.length, 15) * 2
    + (profile.experience_years > 0 ? 10 : 0)
    + (profile.email ? 5 : 0)
    + (len > 2000 ? 5 : 0)
    + (/\d+%|\d+x/i.test(resumeText) ? 10 : 0)
  ));

  return { overall_score: score, strengths, suggestions, ats_tips };
}

/**
 * Generate structured resume feedback.
 * Returns heuristic analysis when USE_AI=false, OpenAI analysis when true.
 */
exports.generate = async (resumeText) => {
  if (!USE_AI) {
    logger.info('feedback.generate → heuristic analysis (no API key needed)');
    return _heuristicFeedback(resumeText);
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
