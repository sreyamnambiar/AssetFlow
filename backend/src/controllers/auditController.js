import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createAuditCycle,
  listAuditCycles,
  getAuditCycleById,
  listAuditors,
} from '../services/auditService.js';

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join('. '), 400);
  }
}

export const getCycles = asyncHandler(async (req, res) => {
  const result = await listAuditCycles(req.query);
  sendSuccess(res, { data: result.items, meta: result.pagination });
});

export const getCycle = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await getAuditCycleById(req.params.id);
  sendSuccess(res, { data });
});

export const addCycle = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await createAuditCycle(req.body);
  sendSuccess(res, { data, message: 'Audit cycle created successfully', statusCode: 201 });
});

export const getAuditors = asyncHandler(async (_req, res) => {
  const data = await listAuditors();
  sendSuccess(res, { data });
});
