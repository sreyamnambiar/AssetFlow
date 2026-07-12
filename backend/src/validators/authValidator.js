import { body } from 'express-validator';
import { USER_ROLES } from '../models/User.js';

export const validateSignup = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role')
    .optional()
    .isIn(USER_ROLES)
    .withMessage('Role must be one of admin, asset_manager, department_head, or employee'),
  body('department').optional().trim(),
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
];
