/**
 * Subscriber Service — Supabase
 *
 * Stores user data after resume upload so we can send the 24-hour digest email.
 *
 * Required Supabase table (run once in Supabase SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS subscribers (
 *     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     email        TEXT NOT NULL,
 *     name         TEXT,
 *     target_role  TEXT,
 *     profile_json JSONB,
 *     matches_json JSONB,
 *     created_at   TIMESTAMPTZ DEFAULT NOW(),
 *     email_sent_at TIMESTAMPTZ,
 *     unsubscribed BOOLEAN DEFAULT FALSE
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);
 *   CREATE INDEX IF NOT EXISTS idx_subscribers_email_sent ON subscribers(email_sent_at) WHERE email_sent_at IS NULL;
 */
const axios = require('axios');

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://jhdvizgpuocsfkkrfijo.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'sb_publishable_dNuGDLqBhtdB0X5g-T3wLw_RaVDeCsP';

const headers = {
  apikey:        SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  'Content-Type': 'application/json',
  Prefer:        'return=minimal',
};

/**
 * Save a subscriber after a successful resume upload.
 * Silently skips if email is missing (some resumes don't have one).
 */
async function saveSubscriber({ profile, matches }) {
  const email = profile?.email?.trim();
  if (!email || !email.includes('@')) return; // no email extracted — skip

  try {
    await axios.post(
      `${SUPABASE_URL}/rest/v1/subscribers`,
      {
        email,
        name:         profile.name || null,
        target_role:  profile.target_role || null,
        profile_json: profile,
        matches_json: matches.slice(0, 20), // store top 20 for digest
      },
      { headers },
    );
  } catch (err) {
    // Non-fatal — don't blow up the upload flow if this fails
    console.warn('[subscriber] Failed to save subscriber:', err?.response?.data || err.message);
  }
}

/**
 * Fetch subscribers whose email hasn't been sent yet,
 * created more than 23 hours ago (gives the cron a 1h window).
 */
async function getPendingSubscribers() {
  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

  const res = await axios.get(`${SUPABASE_URL}/rest/v1/subscribers`, {
    headers: { ...headers, Prefer: 'return=representation' },
    params: {
      select:          'id,email,name,target_role,matches_json',
      email_sent_at:   'is.null',
      unsubscribed:    'is.false',
      created_at:      `lte.${cutoff}`,
      order:           'created_at.asc',
      limit:           100,
    },
  });

  return res.data || [];
}

/**
 * Mark a subscriber's email as sent.
 */
async function markSent(id) {
  await axios.patch(
    `${SUPABASE_URL}/rest/v1/subscribers?id=eq.${id}`,
    { email_sent_at: new Date().toISOString() },
    { headers },
  );
}

/**
 * Unsubscribe a user by their subscriber ID.
 */
async function unsubscribe(id) {
  await axios.patch(
    `${SUPABASE_URL}/rest/v1/subscribers?id=eq.${id}`,
    { unsubscribed: true },
    { headers },
  );
}

module.exports = { saveSubscriber, getPendingSubscribers, markSent, unsubscribe };
