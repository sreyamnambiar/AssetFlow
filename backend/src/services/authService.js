import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function registerUser({ name, email, password, department }) {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const userData = { name, email, password, role: 'employee', status: 'active' };
  if (department) {
    userData.department = department;
  }

  const user = await User.create(userData);
  return user.toObject();
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'inactive') {
    throw new AppError('Account is inactive', 403);
  }

  return user.toObject();
}

export function signToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function getUserById(userId) {
  return User.findById(userId).select('-password').lean();
}

export async function initiateForgotPassword(email) {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return { success: true, message: 'If the email exists, password reset instructions were sent.' };
  }

  return {
    success: true,
    message: 'Password reset placeholder created. Integrate email provider to send reset instructions.',
  };
}