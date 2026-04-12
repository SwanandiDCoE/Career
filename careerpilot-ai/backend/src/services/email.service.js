/**
 * Email Service — Resend
 *
 * Sends the 24-hour "new matches" digest email.
 * Requires RESEND_API_KEY in environment.
 *
 * To set up:
 *   1. Create account at resend.com
 *   2. Add RESEND_API_KEY to Vercel env vars
 *   3. Verify your sending domain (or use onboarding@resend.dev for testing)
 */
const { Resend } = require('resend');

const FROM_EMAIL = process.env.EMAIL_FROM || 'HireNext <noreply@hirenext.org>';
const resend     = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send the daily job digest email.
 *
 * @param {object} opts
 * @param {string} opts.to         - recipient email
 * @param {string} opts.name       - first name
 * @param {string} opts.targetRole - e.g. "Senior React Developer"
 * @param {Array}  opts.matches    - top 3 job matches
 * @param {string} opts.unsubId    - unique ID for one-click unsubscribe link
 */
async function sendDigest({ to, name, targetRole, matches, unsubId }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return { skipped: true };
  }

  const firstName  = name?.split(' ')[0] || 'there';
  const topMatches = matches.slice(0, 3);

  const matchHtml = topMatches.map((m, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1e2130;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="width: 48px; vertical-align: middle;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: ${_scoreColor(m.match_score)}18;
                          border: 1.5px solid ${_scoreColor(m.match_score)}44;
                          text-align: center; line-height: 44px;
                          font-size: 15px; font-weight: 900; color: ${_scoreColor(m.match_score)};">
                ${m.match_score}
              </div>
            </td>
            <td style="padding-left: 14px; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 3px;">
                ${i === 0 ? '→ ' : ''}${m.title} at ${m.company}
              </div>
              <div style="font-size: 12px; color: #64748b;">${m.location || 'Remote'}</div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <a href="${m.job_url && m.job_url !== '#' ? m.job_url : 'https://hirenext.org/dashboard'}"
                 style="display: inline-block; padding: 7px 16px; border-radius: 8px;
                        background: #6366f1; color: #fff; font-size: 12px; font-weight: 700;
                        text-decoration: none;">
                View →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New job matches for you</title>
</head>
<body style="margin: 0; padding: 0; background: #0f1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background: #0f1117; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" width="560" style="background: #13151f; border-radius: 16px;
               border: 1px solid #1e2130; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 24px; border-bottom: 1px solid #1e2130;
                        background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.06) 100%);">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                      <div style="width: 28px; height: 28px; border-radius: 8px;
                                  background: linear-gradient(135deg, #6366f1, #8b5cf6);
                                  text-align: center; line-height: 28px; font-size: 14px;">⚡</div>
                      <span style="font-size: 14px; font-weight: 700; color: #fff;">HireNext</span>
                    </div>
                    <div style="font-size: 22px; font-weight: 900; color: #fff; line-height: 1.3; margin-bottom: 8px;">
                      ${topMatches.length} new jobs match your profile
                    </div>
                    <div style="font-size: 14px; color: #64748b;">
                      Hi ${firstName}, here are today's best fits for your <strong style="color: #a5b4fc;">${targetRole}</strong> profile.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Matches -->
          <tr>
            <td style="padding: 8px 32px 4px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                ${matchHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 32px 28px; text-align: center;">
              <a href="https://hirenext.org/dashboard"
                 style="display: inline-block; padding: 14px 32px; border-radius: 12px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: #fff; font-size: 15px; font-weight: 700; text-decoration: none;
                        box-shadow: 0 4px 16px rgba(99,102,241,0.4);">
                See all your matches →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1e2130; text-align: center;">
              <p style="font-size: 12px; color: #334155; margin: 0;">
                You're receiving this because you uploaded your resume to HireNext.<br />
                <a href="https://hirenext.org/unsubscribe?id=${unsubId}"
                   style="color: #475569; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const result = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      [to],
    subject: `${topMatches.length} new jobs match your ${targetRole} profile`,
    html,
  });

  return result;
}

function _scoreColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 65) return '#60a5fa';
  return '#f59e0b';
}

module.exports = { sendDigest };
