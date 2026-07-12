import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createBooking,
  deleteBooking,
  getBookingById,
  listBookings,
  listBookableAssets,
  updateBooking,
} from '../services/bookingService.js';

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join('. '), 400);
  }
}

export const getBookings = asyncHandler(async (req, res) => {
  const result = await listBookings(req.query);
  sendSuccess(res, { data: result.items, meta: result.pagination });
});

export const getBooking = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await getBookingById(req.params.id);
  sendSuccess(res, { data });
});

export const addBooking = asyncHandler(async (req, res) => {
  handleValidation(req);
  if (!req.user?._id) {
    throw new AppError('Authenticated user not found in token payload', 401);
  }

  const data = await createBooking(req.body, req.user._id);
  sendSuccess(res, { data, message: 'Booking created successfully', statusCode: 201 });
});

export const editBooking = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await updateBooking(req.params.id, req.body);
  sendSuccess(res, { data, message: 'Booking updated successfully' });
});

export const removeBooking = asyncHandler(async (req, res) => {
  handleValidation(req);
  const data = await deleteBooking(req.params.id);
  sendSuccess(res, { data, message: 'Booking cancelled successfully' });
});

export const getResources = asyncHandler(async (req, res) => {
  const data = await listBookableAssets(req.query);
  sendSuccess(res, { data });
});