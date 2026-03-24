const { openai, MODEL } = require('../config/openai');

/**
 * Generate a personalized cold email for a specific job match
 */
exports.coldEmail = async (match, profileSummary) => {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert career coach who writes compelling, personalized cold outreach emails. Write professional emails that are concise, specific, and never feel like templates.`,
      },
      {
        role: 'user',
        content: `Write a cold email for this job application.

Job: ${match.title} at ${match.company}
Candidate's top matching skills: ${match.matched_skills?.join(', ')}
Candidate summary: ${profileSummary}

Requirements:
- Subject line included
- Under 150 words
- Mention a specific skill that aligns with the role
- Warm, confident, human tone
- End with a clear CTA`,
      },
    ],
  });

  return completion.choices[0].message.content;
};

/**
 * Generate an optimized LinkedIn open-to-work post
 */
exports.linkedInPost = async (profileSummary, targetRole) => {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a LinkedIn content strategist who writes posts that get high engagement and recruiter attention.`,
      },
      {
        role: 'user',
        content: `Write a LinkedIn "open to work" post for this person.

Candidate summary: ${profileSummary}
Target role: ${targetRole}

Requirements:
- Hook in the first line (no clichés)
- Highlight 2-3 key skills or achievements
- Clear statement of what roles they're looking for
- Relevant hashtags at the end
- Max 200 words`,
      },
    ],
  });

  return completion.choices[0].message.content;
};
