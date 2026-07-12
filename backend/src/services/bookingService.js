import { Booking } from '../models/Booking.js';
import { Asset } from '../models/Asset.js';
import { AppError } from '../utils/AppError.js';
import { getBookingStatus, isFutureSlot, normalizeTime } from '../utils/date.js';

function buildBookingFilter(query = {}) {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.assetId) filter.assetId = query.assetId;
  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.bookingDate) filter.bookingDate = query.bookingDate;

  if (query.search) {
    filter.$or = [{ purpose: { $regex: query.search, $options: 'i' } }];
  }

  return filter;
}

async function assertAssetBookable(assetId) {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new AppError('Selected resource does not exist', 404);
  }

  if (asset.status !== 'available') {
    throw new AppError('Selected resource is not available for booking', 400);
  }

  return asset;
}

async function assertNoOverlap({ assetId, bookingDate, startTime, endTime, excludeBookingId = null }) {
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  const overlappingBooking = await Booking.findOne({
    assetId,
    bookingDate,
    status: { $ne: 'cancelled' },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
    startTime: { $lt: normalizedEnd },
    endTime: { $gt: normalizedStart },
  });

  if (overlappingBooking) {
    throw new AppError('Booking overlaps with an existing reservation for this resource', 400);
  }
}

function serializeBooking(booking) {
  const bookingDoc = booking.toObject ? booking.toObject() : booking;
  return {
    ...bookingDoc,
    status: getBookingStatus(bookingDoc),
  };
}

export async function listBookings(query) {
  const filter = buildBookingFilter(query);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('assetId', 'name assetCode category location status')
      .populate('employeeId', 'name email role')
      .sort({ bookingDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getBookingById(id) {
  const booking = await Booking.findById(id)
    .populate('assetId', 'name assetCode category location status')
    .populate('employeeId', 'name email role');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  return serializeBooking(booking);
}

export async function createBooking(payload, employeeId) {
  await assertAssetBookable(payload.assetId);
  await assertNoOverlap(payload);

  if (!isFutureSlot(payload.bookingDate, payload.startTime)) {
    throw new AppError('Booking date and time must be in the future', 400);
  }

  const booking = await Booking.create({
    assetId: payload.assetId,
    employeeId,
    purpose: payload.purpose,
    bookingDate: payload.bookingDate,
    startTime: normalizeTime(payload.startTime),
    endTime: normalizeTime(payload.endTime),
    status: 'upcoming',
  });

  return getBookingById(booking._id);
}

export async function updateBooking(id, payload) {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('Cancelled bookings cannot be modified', 400);
  }

  const nextAssetId = payload.assetId || booking.assetId;
  const nextBookingDate = payload.bookingDate || booking.bookingDate;
  const nextStartTime = normalizeTime(payload.startTime || booking.startTime);
  const nextEndTime = normalizeTime(payload.endTime || booking.endTime);

  if (payload.assetId) {
    await assertAssetBookable(payload.assetId);
  }

  if (payload.startTime || payload.endTime || payload.bookingDate || payload.assetId) {
    if (nextEndTime <= nextStartTime) {
      throw new AppError('End Time must be greater than Start Time', 400);
    }

    await assertNoOverlap({
      assetId: nextAssetId,
      bookingDate: nextBookingDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeBookingId: booking._id,
    });
  }

  if (payload.status === 'cancelled') {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
  }

  if (payload.purpose) booking.purpose = payload.purpose;
  if (payload.assetId) booking.assetId = payload.assetId;
  if (payload.bookingDate) booking.bookingDate = payload.bookingDate;
  if (payload.startTime) booking.startTime = nextStartTime;
  if (payload.endTime) booking.endTime = nextEndTime;
  if (payload.status && payload.status !== 'cancelled') booking.status = payload.status;

  await booking.save();
  return getBookingById(booking._id);
}

export async function deleteBooking(id) {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  return getBookingById(booking._id);
}

export async function listBookableAssets(query = {}) {
  const filter = { status: 'available' };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { assetCode: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
    ];
  }

  return Asset.find(filter).sort({ name: 1 });
}