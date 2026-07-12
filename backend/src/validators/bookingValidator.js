import { body, param, query } from 'express-validator';

export const validateBookingId = [param('id').isMongoId().withMessage('Invalid booking id')];

export const validateBookingQuery = [
  query('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const validateBookingCreate = [
  body('assetId').isMongoId().withMessage('Resource is mandatory'),
  body('bookingDate').notEmpty().withMessage('Date is mandatory').isISO8601().withMessage('Date must be valid'),
  body('startTime').notEmpty().withMessage('Start Time is mandatory').matches(/^\d{2}:\d{2}$/).withMessage('Start Time must be valid'),
  body('endTime').notEmpty().withMessage('End Time is mandatory').matches(/^\d{2}:\d{2}$/).withMessage('End Time must be valid'),
  body('purpose').trim().notEmpty().withMessage('Purpose is mandatory'),
];

export const validateBookingUpdate = [
  body('assetId').optional().isMongoId().withMessage('Invalid resource'),
  body('bookingDate').optional().isISO8601().withMessage('Date must be valid'),
  body('startTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Start Time must be valid'),
  body('endTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('End Time must be valid'),
  body('purpose').optional().trim().notEmpty().withMessage('Purpose cannot be empty'),
  body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
];