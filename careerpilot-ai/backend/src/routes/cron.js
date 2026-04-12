/**
 * Cron Routes
 *
 * Called by Vercel Cron Jobs (configured in vercel.json).
 * Protected by CRON_SECRET env var — Vercel sends it as Authorization: Bearer <secret>.
 */
const express           = require('express');
const subscriberService = require('../services/subscriber.service');
const emailService      = require('../services/email.service');
const logger            = require('../utils/logger');

const router = express.Router();

function authCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next(); // dev mode — skip auth
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * POST /api/cron/daily-emails
 *
 * Sends the 24h digest email to all pending subscribers.
 * Vercel Cron: runs daily at 09:00 UTC (configured in vercel.json).
 */
router.post('/daily-emails', authCron, async (req, res) => {
  try {
    const pending = await subscriberService.getPendingSubscribers();
    logger.info(`[cron] Found ${pending.length} subscribers to email`);

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const subscriber of pending) {
      const matches = subscriber.matches_json || [];
      if (!matches.length) { results.skipped++; continue; }

      try {
        const result = await emailService.sendDigest({
          to:         subscriber.email,
          name:       subscriber.name || '',
          targetRole: subscriber.target_role || 'your target role',
          matches,
          unsubId:    subscriber.id,
        });

        if (result?.skipped) { results.skipped++; }
        else {
          await subscriberService.markSent(subscriber.id);
          results.sent++;
        }
      } catch (err) {
        logger.warn(`[cron] Failed to email ${subscriber.email}: ${err.message}`);
        results.failed++;
      }
    }

    logger.info(`[cron] Daily emails complete:`, results);
    return res.json({ ok: true, ...results });
  } catch (err) {
    logger.error('[cron] daily-emails error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/unsubscribe?id=<subscriber_id>
 * One-click unsubscribe link from email footer.
 */
router.get('/unsubscribe', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send('Missing subscriber ID');

  try {
    await subscriberService.unsubscribe(id);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribed — HireNext</title></head>
        <body style="margin:0;padding:60px 24px;background:#0f1117;font-family:sans-serif;text-align:center;color:#94a3b8;">
          <h1 style="color:#f1f5f9;font-size:24px;">You've been unsubscribed.</h1>
          <p>We won't send you any more emails. No hard feelings.</p>
          <a href="https://hirenext.org" style="color:#818cf8;">← Back to HireNext</a>
        </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send('Something went wrong. Please try again.');
  }
});

module.exports = router;
