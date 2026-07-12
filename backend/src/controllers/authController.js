import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  getUserById,
  initiateForgotPassword,
  loginUser,
  registerUser,
  signToken,
} from '../services/authService.js';

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join('. '), 400);
  }
}

export const signup = asyncHandler(async (req, res) => {
  handleValidation(req);
  const user = await registerUser(req.body);
  const token = signToken(user);

  sendSuccess(res, {
    data: { user, token },
    message: 'Account created successfully',
    statusCode: 201,
  });
});

export const login = asyncHandler(async (req, res) => {
  handleValidation(req);
  const user = await loginUser(req.body);
  const token = signToken(user);

  sendSuccess(res, {
    data: { user, token },
    message: 'Login successful',
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  handleValidation(req);
  const result = await initiateForgotPassword(req.body.email);

  sendSuccess(res, {
    data: result,
    message: 'If the email exists, password reset instructions were sent.',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new AppError('Authentication required', 401);
  }

  const user = await getUserById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendSuccess(res, {
    data: user,
    message: 'User profile loaded successfully',
  });
});
