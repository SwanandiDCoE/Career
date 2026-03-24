/**
 * Minimal logger — wraps console with timestamps and log levels.
 * Drop-in replacement path if you add Winston/Pino later.
 */

const LEVELS = { info: '✓', warn: '⚠', error: '✖', debug: '→' };

function log(level, message, meta = null) {
  const ts     = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  const icon   = LEVELS[level] || '·';

  if (meta) {
    console[level === 'error' ? 'error' : 'log'](`${icon} ${prefix} ${message}`, meta);
  } else {
    console[level === 'error' ? 'error' : 'log'](`${icon} ${prefix} ${message}`);
  }
}

module.exports = {
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
