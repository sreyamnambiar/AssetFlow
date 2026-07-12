import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createAuditCycle,
  listAuditCycles,
  getAuditCycleById,
  listAuditors,
  verifyAssetRecord,
  closeAuditCycle,
  getAuditHistory,
} from '../services/auditService.js';

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((e) => e.msg).join('. '), 400);
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

// POST /audit/:id/verify
export const verifyRecord = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await verifyAssetRecord(req.params.id, req.body.recordId, {
    status: req.body.status,
    notes:  req.body.notes,
  });
  sendSuccess(res, { data, message: 'Asset verification status updated' });
});

// POST /audit/:id/close
export const closeCycle = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await closeAuditCycle(req.params.id);
  sendSuccess(res, { data, message: 'Audit cycle closed successfully' });
});

// GET /audit/history
export const getHistory = asyncHandler(async (req, res) => {
  const result = await getAuditHistory(req.query);
  sendSuccess(res, { data: result.items, meta: result.pagination });
});
