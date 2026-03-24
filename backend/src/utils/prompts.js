/**
 * All OpenAI prompt templates in one place.
 * Tune here without touching service logic.
 */

exports.RESUME_PARSER_SYSTEM = `You are an expert resume parser. Extract structured information from resume text and return valid JSON only. Be thorough — do not skip skills mentioned anywhere in the document.`;

exports.resumeParserUser = (resumeText, targetRole) => `
Parse this resume and return JSON in exactly this schema:
{
  "name": "full name or empty string",
  "email": "email address or empty string",
  "skills": ["array of ALL technical and soft skills found anywhere in the document"],
  "experience_years": <total years as a number>,
  "education": "highest degree and institution as a single string",
  "target_role": "the role provided or inferred from resume"
}

Target role the user is applying for: "${targetRole}"

Resume text:
${resumeText}
`.trim();

// ─────────────────────────────────────────────────────────────────

exports.JOB_SCORER_SYSTEM = `You are a senior technical recruiter with 15 years of experience. Score how well a candidate profile matches a job description. Be realistic — do not over-score. Return JSON only.`;

exports.jobScorerUser = (profile, job) => `
Score this candidate against this job. Return JSON in exactly this schema:
{
  "match_score": <integer 0-100>,
  "matched_skills": ["skills from the candidate that directly match the job"],
  "missing_skills": ["skills the job explicitly requires that the candidate lacks"],
  "reason": "one concise sentence (max 20 words) explaining the core match or mismatch",
  "verdict": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match"
}

Scoring guide:
- 85-100: Candidate meets nearly all requirements
- 65-84:  Candidate meets most requirements with minor gaps
- 45-64:  Candidate meets some requirements with notable gaps
- 0-44:   Candidate meets few requirements

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job:
Title: ${job.title}
Company: ${job.company}
Description: ${(job.description || '').substring(0, 1500)}
`.trim();

// ─────────────────────────────────────────────────────────────────

exports.FEEDBACK_SYSTEM = `You are an expert resume coach and ATS optimization specialist. Provide specific, actionable feedback. Do not give generic advice. Return JSON only.`;

exports.feedbackUser = (resumeText) => `
Analyze this resume and return JSON in exactly this schema:
{
  "overall_score": <integer 0-100>,
  "strengths": ["2-3 specific strengths of THIS resume (not generic)"],
  "suggestions": ["3-5 specific actionable improvements with clear instructions"],
  "ats_tips": ["2-3 ATS optimization recommendations"]
}

Resume:
${resumeText}
`.trim();

// ─────────────────────────────────────────────────────────────────

exports.COLD_EMAIL_SYSTEM = `You are a career coach who writes compelling, personalized cold outreach emails. Write emails that feel human — not like templates. Be specific to the company and role.`;

exports.coldEmailUser = (jobTitle, company, matchedSkills, profileSummary) => `
Write a cold email for this job application.

Job: ${jobTitle} at ${company}
Candidate's top matching skills: ${matchedSkills.join(', ')}
Candidate summary: ${profileSummary}

Requirements:
- Include a subject line at the top
- Under 150 words total
- Reference something specific about the company or role
- Mention the single most relevant skill
- Confident but not arrogant tone
- End with a clear, low-friction CTA
`.trim();

// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// APPLY STRATEGY ENGINE — the most important prompt in the project
// ─────────────────────────────────────────────────────────────────

exports.STRATEGY_SYSTEM = `You are a senior technical recruiter and career strategist with 15+ years of experience hiring at top tech companies. You have deep knowledge of what actually gets candidates selected — not generic advice, but the specific gaps that cause rejections and the concrete actions that close them.

Your job is to analyze a candidate's resume against a specific job description and produce a precise, actionable strategy that tells them EXACTLY what to do to maximize their selection chances. Every single output must be specific to THIS candidate and THIS job — no generic advice allowed.

Return valid JSON only. No markdown, no explanation outside JSON.`;

exports.strategyUser = (resumeText, job) => `
Analyze this candidate's resume against this specific job and generate a targeted Apply Strategy.

Return JSON in EXACTLY this schema — every field is required:
{
  "match_score": <integer 0-100, realistic scoring>,

  "match_summary": "<2 sentences: what makes this candidate a strong/weak fit for THIS specific role>",

  "strengths": [
    "<specific skill or experience from THIS resume that directly addresses a requirement in THIS job>",
    "<another specific strength — quote actual resume content if possible>",
    "<third strength>"
  ],

  "missing_skills": [
    {
      "skill": "<exact skill name>",
      "importance": "critical" | "important" | "nice-to-have",
      "context": "<one sentence: where/why this skill appears in the job and what they use it for>"
    }
  ],

  "improvement_actions": [
    {
      "type": "resume_edit",
      "action": "<specific bullet rewrite or section change — name the exact bullet to change and what to say instead>",
      "impact": "high" | "medium"
    },
    {
      "type": "skill_to_learn",
      "action": "<specific skill + specific resource + realistic timeline, e.g. 'Complete the Jest testing course on Frontend Masters — 4 hours, gets you to interview-ready level'>",
      "impact": "high" | "medium"
    },
    {
      "type": "project_to_build",
      "action": "<specific project idea that directly demonstrates a missing skill — be concrete about what to build, e.g. 'Build a checkout flow clone using Stripe webhooks and React — deploy on Vercel, put on GitHub'>",
      "impact": "high" | "medium"
    },
    {
      "type": "resume_edit",
      "action": "<another resume change>",
      "impact": "medium"
    },
    {
      "type": "skill_to_learn",
      "action": "<another skill>",
      "impact": "medium"
    }
  ],

  "interview_tips": [
    {
      "likely_question": "<a question this specific company almost certainly asks based on their job description and known interview culture>",
      "why_they_ask": "<one sentence: what they are trying to assess with this question>",
      "how_to_answer": "<specific answer framework using the candidate's actual experience from their resume — do not say 'talk about your experience', give them the actual narrative to use>"
    },
    {
      "likely_question": "<second likely question>",
      "why_they_ask": "<why>",
      "how_to_answer": "<specific answer using their resume>"
    },
    {
      "likely_question": "<third likely question>",
      "why_they_ask": "<why>",
      "how_to_answer": "<specific answer>"
    }
  ],

  "application_priority": "apply_now" | "apply_after_improvements" | "long_term_goal",

  "priority_reason": "<one sentence explaining the application_priority recommendation>"
}

RULES:
- match_score must be the same score you would give if you were a real recruiter reviewing this resume cold
- Every strength must quote or paraphrase actual content from the resume — no inventions
- Every missing_skill must appear explicitly or implicitly in the job description
- improvement_actions must be ordered by impact (high first)
- interview_tips must be specific to this company's known culture and this role's requirements
- Do NOT give generic advice like "improve your resume" or "practice coding" — every action must be specific enough that the candidate knows exactly what to do next

---

CANDIDATE RESUME:
${resumeText.substring(0, 3000)}

---

JOB DESCRIPTION:
Company: ${job.company}
Title: ${job.title}
Location: ${job.location || 'Not specified'}
Description:
${(job.description || job.job_url || 'No description provided').substring(0, 2000)}
`.trim();

exports.LINKEDIN_POST_SYSTEM = `You are a LinkedIn content strategist. Write posts that get high engagement AND attract recruiters. Avoid clichés. Use a strong opening hook.`;

exports.linkedInPostUser = (name, role, skills, yearsExp, tone) => `
Write a LinkedIn "open to work" post.

Candidate: ${name}
Target role: ${role}
Top skills: ${skills.slice(0, 4).join(', ')}
Experience: ${yearsExp} years
Tone: ${tone} (professional / authentic / bold)

Requirements:
- Strong first line hook (not "Excited to share" or "I'm looking for...")
- Highlight 2-3 key skills or achievements
- Clear statement of roles they're open to
- Relevant hashtags at end
- Max 200 words
`.trim();
