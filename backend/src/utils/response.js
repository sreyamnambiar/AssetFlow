export function sendSuccess(res, { data = null, message = 'Success', statusCode = 200, meta = {} } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}