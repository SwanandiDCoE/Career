/**
 * Standardised API response helpers.
 * Every endpoint returns the same envelope shape so the frontend
 * always knows what to expect.
 *
 * Success:  { success: true,  data: {...},  message?: "..." }
 * Error:    { success: false, error: "...", code?: "..." }
 */

exports.ok = (res, data, message = null, statusCode = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

exports.created = (res, data, message = 'Created successfully') => {
  return exports.ok(res, data, message, 201);
};

exports.badRequest = (res, message = 'Bad request') => {
  return res.status(400).json({ success: false, error: message });
};

exports.notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, error: message });
};

exports.serverError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, error: message });
};
