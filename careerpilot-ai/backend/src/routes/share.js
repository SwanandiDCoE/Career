/**
 * Share Route
 *
 * POST /api/share — creates a shareable public profile card
 * Returns: { slug, url }
 *
 * Required Supabase table (run once in SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS profile_cards (
 *     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     slug            TEXT UNIQUE NOT NULL,
 *     name            TEXT,
 *     target_role     TEXT,
 *     experience_years INTEGER,
 *     skills          JSONB,
 *     top_match       JSONB,
 *     resume_score    INTEGER,
 *     created_at      TIMESTAMPTZ DEFAULT NOW()
 *   );
 */
const express = require('express');
const axios   = require('axios');
const logger  = require('../utils/logger');

const router = express.Router();

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://jhdvizgpuocsfkkrfijo.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'sb_publishable_dNuGDLqBhtdB0X5g-T3wLw_RaVDeCsP';
const FRONTEND_URL  = process.env.FRONTEND_URL  || 'https://hirenext.org';

const headers = {
  apikey:         SUPABASE_ANON,
  Authorization:  `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json',
  Prefer:         'return=representation',
};

function generateSlug(name, targetRole) {
  const first = (name || 'user').split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || 'user';
  const role  = (targetRole || 'developer')
    .toLowerCase().replace(/[^a-z0-9\s]/g, '')
    .trim().split(/\s+/).slice(0, 2).join('-') || 'dev';
  const rand  = Math.random().toString(36).slice(2, 6);
  return `${first}-${role}-${rand}`;
}

router.post('/', async (req, res) => {
  const { profile, topMatch, resumeScore, topMatches } = req.body;

  if (!profile?.name) {
    return res.status(400).json({ error: 'profile.name is required' });
  }

  const slug = generateSlug(profile.name, profile.target_role);

  try {
    const result = await axios.post(
      `${SUPABASE_URL}/rest/v1/profile_cards`,
      {
        slug,
        name:             profile.name,
        target_role:      profile.target_role || null,
        experience_years: profile.experience_years || null,
        skills:           (profile.skills || []).slice(0, 8),
        top_match:        topMatch ? {
          title:       topMatch.title,
          company:     topMatch.company,
          match_score: topMatch.match_score,
          // Store top 3 for richer profile card display
          all_matches: Array.isArray(topMatches) && topMatches.length > 0
            ? topMatches.slice(0, 3).map(m => ({
                title:       m.title,
                company:     m.company,
                match_score: m.match_score,
              }))
            : undefined,
        } : null,
        resume_score: resumeScore || null,
      },
      { headers },
    );

    const card = result.data?.[0];
    const url  = `${FRONTEND_URL}/profile/${slug}`;

    logger.info(`[share] Created profile card: ${slug}`);
    return res.json({ slug, url, id: card?.id });
  } catch (err) {
    // If slug collision, retry once with a new slug (extremely rare)
    if (err?.response?.status === 409) {
      const slug2 = generateSlug(profile.name, profile.target_role);
      try {
        await axios.post(`${SUPABASE_URL}/rest/v1/profile_cards`,
          { slug: slug2, name: profile.name, target_role: profile.target_role,
            experience_years: profile.experience_years,
            skills: (profile.skills || []).slice(0, 8),
            top_match: topMatch ? { title: topMatch.title, company: topMatch.company, match_score: topMatch.match_score } : null,
            resume_score: resumeScore },
          { headers });
        return res.json({ slug: slug2, url: `${FRONTEND_URL}/profile/${slug2}` });
      } catch (err2) {
        logger.error('[share] Retry failed:', err2.message);
      }
    }
    logger.error('[share] Error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create profile card' });
  }
});

/* GET /api/share/:slug — fetch a card by slug (used by profile page) */
router.get('/:slug', async (req, res) => {
  try {
    const result = await axios.get(`${SUPABASE_URL}/rest/v1/profile_cards`, {
      headers: { ...headers, Prefer: 'return=representation' },
      params: { slug: `eq.${req.params.slug}`, select: '*', limit: 1 },
    });
    const card = result.data?.[0];
    if (!card) return res.status(404).json({ error: 'Profile card not found' });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile card' });
  }
});

module.exports = router;
