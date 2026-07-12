import { body, param } from 'express-validator';

export const validateAuditId = [
  param('id').isMongoId().withMessage('Invalid audit cycle id'),
];

export const validateAuditCycleCreate = [
  body('name').trim().notEmpty().withMessage('Audit Name is mandatory'),
  body('department').trim().notEmpty().withMessage('Department is mandatory'),
  body('location').trim().notEmpty().withMessage('Location is mandatory'),
  body('startDate')
    .notEmpty().withMessage('Start Date is mandatory')
    .isISO8601().withMessage('Start Date must be a valid date'),
  body('endDate')
    .notEmpty().withMessage('End Date is mandatory')
    .isISO8601().withMessage('End Date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End Date must be after or equal to Start Date');
      }
      return true;
    }),
  body('auditors').optional().isArray().withMessage('Auditors must be an array'),
  body('auditors.*').optional().isMongoId().withMessage('Invalid auditor user ID'),
];

export const validateVerifyRecord = [
  param('id').isMongoId().withMessage('Invalid audit cycle id'),
  body('recordId').isMongoId().withMessage('Invalid record id'),
  body('status')
    .isIn(['pending', 'verified', 'missing', 'damaged'])
    .withMessage('Status must be pending, verified, missing, or damaged'),
  body('notes').optional().isString().trim(),
];

export const validateCloseAudit = [
  param('id').isMongoId().withMessage('Invalid audit cycle id'),
];
