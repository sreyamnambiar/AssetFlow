import { body, param, query } from 'express-validator';

export const validateMaintenanceId = [param('id').isMongoId().withMessage('Invalid maintenance id')];

export const validateMaintenanceQuery = [
  query('status').optional().isIn(['pending', 'approved', 'technician_assigned', 'in_progress', 'resolved', 'rejected', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const validateMaintenanceCreate = [
  body('assetId').isMongoId().withMessage('Asset must exist'),
  body('issueDescription').trim().notEmpty().withMessage('Issue description required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Priority required'),
];

export const validateMaintenanceUpdate = [
  body('assetId').optional().isMongoId().withMessage('Invalid asset'),
  body('issueDescription').optional().trim().notEmpty().withMessage('Issue description cannot be empty'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be valid'),
  body('status').optional().isIn(['pending', 'approved', 'technician_assigned', 'in_progress', 'resolved', 'rejected', 'cancelled']),
  body('technician').optional().isMongoId().withMessage('Invalid technician id'),
];