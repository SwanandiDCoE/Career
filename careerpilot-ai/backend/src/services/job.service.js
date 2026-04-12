const axios                = require('axios');
const { openai, MODEL }    = require('../config/openai');
const { DUMMY_JOBS, DUMMY_MATCHES } = require('../utils/dummy');
const prompts              = require('../utils/prompts');
const { normalizeSkills, skillOverlap, extractSkillsFromText } = require('../utils/skillNormalizer');
const logger               = require('../utils/logger');

const USE_AI        = process.env.USE_AI        === 'true';
const USE_LIVE_JOBS = process.env.USE_LIVE_JOBS === 'true';
const PYTHON_URL    = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

// ── Fetch Jobs ─────────────────────────────────────────────────────

/**
 * Fetch job listings.
 *
 * Sends richer profile signals to the Python service:
 *   - skills (top 15, normalized)
 *   - seniority level
 *   - domain
 *   - work_preference
 */
exports.fetchJobs = async (jobTitle, location = 'Remote', skills = [], profileMeta = {}) => {
  if (!USE_LIVE_JOBS) {
    logger.info('fetchJobs -> dummy mode (USE_LIVE_JOBS=false)');
    return DUMMY_JOBS;
  }

  logger.info(`fetchJobs -> live | role:"${jobTitle}" seniority:${profileMeta.seniority} domain:${profileMeta.domain}`);

  try {
    const res = await axios.post(
      `${PYTHON_URL}/`,
      {
        job_title:      jobTitle.trim(),
        location:       location?.trim() || 'India',
        skills:         normalizeSkills(skills).slice(0, 15),
        seniority:      profileMeta.seniority      || null,
        domain:         profileMeta.domain          || null,
        work_preference:profileMeta.work_preference || null,
        results_wanted: 120,
      },
      { timeout: 20_000 }
    );

    let jobs = res.data && Array.isArray(res.data.jobs) ? res.data.jobs : [];
    logger.info(`fetchJobs -> ${jobs.length} jobs from DB`);
    return jobs.map(_normaliseJob);

  } catch (err) {
    logger.warn(`fetchJobs -> Python service error: ${err.message} -- falling back to dummy`);
    return DUMMY_JOBS;
  }
};

function _normaliseJob(j) {
  return {
    title:          j.title         || '',
    company:        j.company       || '',
    location:       j.location      || '',
    job_url:        j.job_url       || '#',
    description:    j.description   || '',
    date_posted:    j.date_posted   || '',
    job_type:       j.job_type      || '',
    source:         j.source        || '',
    skills:         Array.isArray(j.skills)       ? j.skills       : [],
    requirements:   Array.isArray(j.requirements) ? j.requirements : [],
    work_mode:      j.work_mode      || '',
    salary_min:     j.salary_min     || null,
    salary_max:     j.salary_max     || null,
    salary_raw:     j.salary_raw     || '',
    company_domain: j.company_domain || '',
  };
}

// ── Multi-factor Scorer ────────────────────────────────────────────

/**
 * Score jobs against the candidate profile.
 *
 * USE_AI=true  → GPT scores in batches of 5 (accurate, costly)
 * USE_AI=false → deterministic multi-factor formula (fast, no cost)
 */
exports.scoreJobs = async (profile, jobs) => {
  const isRealJobs = jobs.length > 0 &&
    jobs[0].job_url !== (DUMMY_JOBS[0] && DUMMY_JOBS[0].job_url);

  if (!USE_AI) {
    logger.info(`scoreJobs -> multi-factor scoring (${jobs.length} jobs)`);
    if (isRealJobs) return _multiFactorScore(profile, jobs);
    return DUMMY_MATCHES;
  }

  logger.info(`scoreJobs -> GPT scoring ${jobs.length} jobs`);
  const BATCH = 5;
  const out   = [];
  for (let i = 0; i < jobs.length; i += BATCH) {
    const scored = await Promise.all(
      jobs.slice(i, i + BATCH).map(j => _scoreOne(profile, j))
    );
    out.push(...scored.filter(Boolean));
  }
  return out.sort((a, b) => b.match_score - a.match_score);
};

// ── Scoring sub-functions ──────────────────────────────────────────

/**
 * Factor 1 — Skill overlap (weight: 45%)
 * Uses normalized skills and overlap ratio.
 */
function _skillScore(profile, job) {
  // Use job.skills if populated; otherwise fall back to extracting from description
  const jobSkills = (job.skills && job.skills.length > 0)
    ? job.skills
    : extractSkillsFromText(job.description || '');

  const { overlapRatio, matched, missing } = skillOverlap(
    profile.skills || [],
    jobSkills
  );
  return { score: overlapRatio, matched, missing };
}

/**
 * Factor 2 — Title similarity (weight: 25%)
 * Jaccard similarity on word tokens, case-insensitive.
 */
function _titleScore(profileRole, jobTitle) {
  const tokenize = str =>
    new Set((str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));

  const profileTokens = tokenize(profileRole);
  const jobTokens     = tokenize(jobTitle);

  if (profileTokens.size === 0 || jobTokens.size === 0) return 0.5;

  const intersection = [...profileTokens].filter(t => jobTokens.has(t)).length;
  const union = new Set([...profileTokens, ...jobTokens]).size;

  return union > 0 ? intersection / union : 0.5;
}

/**
 * Factor 3 — Seniority alignment (weight: 15%)
 * Maps candidate seniority vs job title keywords.
 */
const SENIORITY_LEVELS = { junior: 1, mid: 2, senior: 3, lead: 4, principal: 5 };

const TITLE_SENIORITY_PATTERNS = [
  { level: 'principal', rx: /\b(principal|distinguished|fellow|vp\s+eng)\b/i },
  { level: 'lead',      rx: /\b(lead|staff|architect|head|manager|tech\s+lead)\b/i },
  { level: 'senior',    rx: /\b(senior|sr\.?|iii|level\s*[56])\b/i },
  { level: 'mid',       rx: /\b(ii|level\s*[34]|sde\s*ii)\b/i },
  { level: 'junior',    rx: /\b(junior|jr\.?|associate|entry|intern|trainee|level\s*[12])\b/i },
];

function _inferJobSeniority(jobTitle) {
  for (const { level, rx } of TITLE_SENIORITY_PATTERNS) {
    if (rx.test(jobTitle)) return level;
  }
  return 'mid'; // default assumption for unlabelled roles
}

function _seniorityScore(profile, jobTitle) {
  const profileLevel = SENIORITY_LEVELS[profile.seniority] || 2;
  const jobLevel     = SENIORITY_LEVELS[_inferJobSeniority(jobTitle)] || 2;
  const gap          = Math.abs(profileLevel - jobLevel);

  // 0 gap → 1.0, 1 gap → 0.75, 2 gap → 0.4, 3+ gap → 0.1
  if (gap === 0) return 1.0;
  if (gap === 1) return 0.75;
  if (gap === 2) return 0.4;
  return 0.1;
}

/**
 * Factor 4 — Location / work mode preference (weight: 10%)
 */
function _locationScore(profile, job) {
  const pref    = (profile.work_preference || '').toLowerCase();
  const jobMode = (job.work_mode || '').toLowerCase();

  // Candidate prefers remote
  if (pref === 'remote') {
    if (jobMode === 'remote') return 1.0;
    if (jobMode === 'hybrid') return 0.5;
    return 0.2;
  }

  // Candidate prefers onsite
  if (pref === 'onsite') {
    if (jobMode === 'onsite' || jobMode === 'on-site') return 1.0;
    if (jobMode === 'hybrid') return 0.7;
    if (jobMode === 'remote') return 0.4;
  }

  // No stated preference → neutral
  return 0.65;
}

/**
 * Factor 5 — Industry / domain match (weight: 5%)
 */
function _domainScore(profile, job) {
  if (!profile.domain || !job.company_domain) return 0.5; // unknown
  return profile.domain.toLowerCase() === job.company_domain.toLowerCase() ? 1.0 : 0.3;
}

/**
 * Master multi-factor scorer.
 *
 * score = skill*0.45 + title*0.25 + seniority*0.15 + location*0.10 + domain*0.05
 * Final score range: ~25–95 (intentionally not 0–100 to avoid extremes in non-AI mode)
 */
function _multiFactorScore(profile, jobs) {
  return jobs
    .map(job => {
      const { score: skillRatio, matched, missing } = _skillScore(profile, job);
      const titleRatio     = _titleScore(profile.target_role, job.title);
      const seniorityRatio = _seniorityScore(profile, job.title);
      const locationRatio  = _locationScore(profile, job);
      const domainRatio    = _domainScore(profile, job);

      const raw = (
        skillRatio     * 0.45 +
        titleRatio     * 0.25 +
        seniorityRatio * 0.15 +
        locationRatio  * 0.10 +
        domainRatio    * 0.05
      );

      const match_score = Math.round(Math.min(95, Math.max(20, raw * 100)));

      const verdict = match_score >= 80 ? 'Strong Match'
                    : match_score >= 65 ? 'Good Match'
                    : match_score >= 45 ? 'Partial Match'
                    : 'Weak Match';

      // Human-readable reason
      const topSkill   = matched[0] || null;
      const senGap     = Math.abs((SENIORITY_LEVELS[profile.seniority] || 2) - (SENIORITY_LEVELS[_inferJobSeniority(job.title)] || 2));
      let reason;
      if (match_score >= 75 && topSkill) {
        reason = `Your ${topSkill} experience aligns strongly with this ${_inferJobSeniority(job.title)}-level role.`;
      } else if (senGap >= 2) {
        reason = `Seniority mismatch — this role targets a ${_inferJobSeniority(job.title)} level, but your profile suggests ${profile.seniority}.`;
      } else if (missing.length > matched.length) {
        reason = `Skill gaps in ${missing.slice(0, 2).join(' and ')} reduce the fit.`;
      } else {
        reason = `Partial match — some skills align but the role has different core requirements.`;
      }

      return {
        title:          job.title,
        company:        job.company,
        location:       job.location,
        job_url:        job.job_url,
        description:    job.description    || '',
        match_score,
        matched_skills: matched.slice(0, 8),
        missing_skills: missing.slice(0, 5),
        reason,
        verdict,
        work_mode:      job.work_mode      || '',
        salary_raw:     job.salary_raw     || '',
        company_domain: job.company_domain || '',
        source:         job.source         || '',
        date_posted:    job.date_posted    || '',
        // Debug breakdown (stripped by frontend, useful for logging)
        _score_breakdown: {
          skill:     Math.round(skillRatio * 100),
          title:     Math.round(titleRatio * 100),
          seniority: Math.round(seniorityRatio * 100),
          location:  Math.round(locationRatio * 100),
          domain:    Math.round(domainRatio * 100),
        },
      };
    })
    .sort((a, b) => b.match_score - a.match_score);
}

// ── GPT scorer ─────────────────────────────────────────────────────

async function _scoreOne(profile, job) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: prompts.JOB_SCORER_SYSTEM },
        { role: 'user',   content: prompts.jobScorerUser(profile, job) },
      ],
    });

    const scored = JSON.parse(completion.choices[0].message.content);

    return {
      title:          job.title    || '',
      company:        job.company  || '',
      location:       job.location || '',
      job_url:        job.job_url  || '#',
      description:    job.description    || '',
      match_score:    Math.min(100, Math.max(0, Number(scored.match_score) || 0)),
      matched_skills: normalizeSkills(Array.isArray(scored.matched_skills) ? scored.matched_skills : []),
      missing_skills: Array.isArray(scored.missing_skills) ? scored.missing_skills : [],
      reason:         scored.reason  || '',
      verdict:        scored.verdict || 'Partial Match',
      work_mode:      job.work_mode      || '',
      salary_raw:     job.salary_raw     || '',
      company_domain: job.company_domain || '',
      source:         job.source         || '',
      date_posted:    job.date_posted    || '',
    };
  } catch (err) {
    logger.error(`_scoreOne failed for "${job.title}" @ "${job.company}": ${err.message}`);
    return null;
  }
}

exports.matchOne = async (profile, job) => {
  if (!USE_AI) {
    const dummy = DUMMY_MATCHES.find(
      m => m.title.toLowerCase().includes((job.title || '').toLowerCase())
    ) || DUMMY_MATCHES[0];
    return Object.assign({}, dummy, { title: job.title || dummy.title, company: job.company || dummy.company });
  }
  const result = await _scoreOne(profile, job);
  if (!result) throw new Error('Failed to score job');
  return result;
};
