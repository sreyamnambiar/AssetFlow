import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    req.user = decoded;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
}