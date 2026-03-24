const axios             = require('axios');
const { openai, MODEL } = require('../config/openai');
const { DUMMY_JOBS, DUMMY_MATCHES } = require('../utils/dummy');
const prompts           = require('../utils/prompts');
const logger            = require('../utils/logger');

const USE_AI        = process.env.USE_AI        === 'true';
const USE_LIVE_JOBS = process.env.USE_LIVE_JOBS === 'true';
const PYTHON_URL    = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

// ── Fetch Jobs ────────────────────────────────────────────────────

/**
 * Fetch job listings.
 *
 * USE_LIVE_JOBS=true  → query PostgreSQL DB via Python /jobs/search
 *                       using the candidate's real skills + location.
 * USE_LIVE_JOBS=false → return DUMMY_JOBS for zero-config demo.
 *
 * @param {string}   jobTitle  - Target role (keyword fallback)
 * @param {string}   location  - City e.g. "Bangalore"
 * @param {string[]} skills    - Skills extracted from the resume
 */
exports.fetchJobs = async (jobTitle, location = 'Remote', skills = []) => {
  if (!USE_LIVE_JOBS) {
    logger.info('fetchJobs -> dummy mode (USE_LIVE_JOBS=false)');
    return DUMMY_JOBS;
  }

  logger.info(`fetchJobs -> querying DB | role:"${jobTitle}" location:"${location}" skills:[${skills.slice(0,6).join(', ')}]`);

  try {
    // Primary: skills + location filter
    const params = new URLSearchParams();
    if (skills && skills.length > 0) params.set('skills', skills.slice(0, 8).join(','));
    if (location && location.toLowerCase() !== 'remote') params.set('location', location.trim());
    params.set('keywords', jobTitle.trim());
    params.set('limit', '30');

    logger.info(`fetchJobs -> GET ${PYTHON_URL}/jobs/search?${params}`);
    const res  = await axios.get(`${PYTHON_URL}/jobs/search?${params}`, { timeout: 10_000 });
    let   jobs = res.data && res.data.data ? res.data.data : [];
    logger.info(`fetchJobs -> ${jobs.length} jobs matched (skills + location)`);

    // Fallback: widen to keyword-only if nothing matched
    if (jobs.length === 0) {
      logger.info('fetchJobs -> widening to keyword-only search');
      const wide    = new URLSearchParams({ keywords: jobTitle.trim(), limit: '30' });
      const wideRes = await axios.get(`${PYTHON_URL}/jobs/search?${wide}`, { timeout: 10_000 });
      jobs = wideRes.data && wideRes.data.data ? wideRes.data.data : [];
      logger.info(`fetchJobs -> widened: ${jobs.length} jobs`);
    }

    // Last resort: return latest 30 jobs from DB
    if (jobs.length === 0) {
      logger.info('fetchJobs -> last resort: returning latest 30 jobs');
      const latest    = new URLSearchParams({ limit: '30' });
      const latestRes = await axios.get(`${PYTHON_URL}/jobs/search?${latest}`, { timeout: 10_000 });
      jobs = latestRes.data && latestRes.data.data ? latestRes.data.data : [];
    }

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

// ── Score Jobs ────────────────────────────────────────────────────

exports.scoreJobs = async (profile, jobs) => {
  if (!USE_AI) {
    logger.info('scoreJobs -> skill-overlap scoring (USE_AI=false)');
    const isRealJobs = jobs.length > 0 && jobs[0].job_url !== (DUMMY_JOBS[0] && DUMMY_JOBS[0].job_url);
    if (isRealJobs) return _skillOverlapScore(profile, jobs);
    return DUMMY_MATCHES;
  }

  logger.info(`scoreJobs -> GPT scoring ${jobs.length} jobs`);
  const BATCH = 5;
  const out   = [];
  for (let i = 0; i < jobs.length; i += BATCH) {
    const scored = await Promise.all(jobs.slice(i, i + BATCH).map(function(j) { return _scoreOne(profile, j); }));
    out.push(...scored.filter(Boolean));
  }
  return out.sort(function(a, b) { return b.match_score - a.match_score; });
};

function _skillOverlapScore(profile, jobs) {
  const profileSkills = (profile.skills || []).map(function(s) { return s.toLowerCase(); });

  return jobs
    .map(function(job) {
      const jobSkills = (job.skills || []).map(function(s) { return s.toLowerCase(); });

      const matched = jobSkills.filter(function(s) {
        return profileSkills.some(function(p) { return p.includes(s) || s.includes(p); });
      });
      const missing = jobSkills.filter(function(s) {
        return !profileSkills.some(function(p) { return p.includes(s) || s.includes(p); });
      });

      const overlapRatio = jobSkills.length > 0 ? matched.length / jobSkills.length : 0.5;
      const score        = Math.round(45 + overlapRatio * 50);

      const verdict = score >= 85 ? 'Strong Match'
                    : score >= 65 ? 'Good Match'
                    : score >= 45 ? 'Partial Match'
                    : 'Weak Match';

      const m0 = matched[0] ? _titleCase(matched[0]) : '';
      const m1 = matched[1] ? _titleCase(matched[1]) : m0;

      return {
        title:          job.title,
        company:        job.company,
        location:       job.location,
        job_url:        job.job_url,
        match_score:    score,
        matched_skills: matched.slice(0, 6).map(_titleCase),
        missing_skills: missing.slice(0, 5).map(_titleCase),
        reason: matched.length > 0
          ? `Your ${m0} and ${m1} skills match this role.`
          : 'This role requires skills not yet in your profile.',
        verdict,
        work_mode:      job.work_mode      || '',
        salary_raw:     job.salary_raw     || '',
        company_domain: job.company_domain || '',
        source:         job.source         || '',
        date_posted:    job.date_posted    || '',
      };
    })
    .sort(function(a, b) { return b.match_score - a.match_score; });
}

function _titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
      match_score:    Math.min(100, Math.max(0, Number(scored.match_score) || 0)),
      matched_skills: Array.isArray(scored.matched_skills) ? scored.matched_skills : [],
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
      function(m) { return m.title.toLowerCase().includes(job.title ? job.title.toLowerCase() : ''); }
    ) || DUMMY_MATCHES[0];
    return Object.assign({}, dummy, { title: job.title || dummy.title, company: job.company || dummy.company });
  }
  const result = await _scoreOne(profile, job);
  if (!result) throw new Error('Failed to score job');
  return result;
};
