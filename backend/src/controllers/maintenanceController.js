import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceById,
  listMaintenanceRequests,
  listTechnicians,
  updateMaintenanceRequest,
} from '../services/maintenanceService.js';

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join('. '), 400);
  }
}

export const getMaintenance = asyncHandler(async (req, res) => {
  const result = await listMaintenanceRequests(req.query);
  sendSuccess(res, { data: result.items, meta: result.pagination });
});

export const getMaintenanceRequest = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await getMaintenanceById(req.params.id);
  sendSuccess(res, { data });
});

export const addMaintenanceRequest = asyncHandler(async (req, res) => {
  handleValidation(req);
  if (!req.user?._id) {
    throw new AppError('Authenticated user not found in token payload', 401);
  }

  const imagePath = req.file ? `/uploads/maintenance/${req.file.filename}` : '';
  const data = await createMaintenanceRequest(req.body, req.user._id, imagePath);
  sendSuccess(res, { data, message: 'Maintenance request created successfully', statusCode: 201 });
});

export const editMaintenanceRequest = asyncHandler(async (req, res) => {
  handleValidation(req);
  const imagePath = req.file ? `/uploads/maintenance/${req.file.filename}` : undefined;
  const data = await updateMaintenanceRequest(req.params.id, req.body, imagePath);
  sendSuccess(res, { data, message: 'Maintenance request updated successfully' });
});

export const removeMaintenanceRequest = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await deleteMaintenanceRequest(req.params.id);
  sendSuccess(res, { data, message: 'Maintenance request cancelled successfully' });
});

export const getTechnicians = asyncHandler(async (_req, res) => {
  const data = await listTechnicians();
  sendSuccess(res, { data });
});