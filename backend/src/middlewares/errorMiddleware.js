import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}