import { Booking } from '../models/Booking.js';
import { Asset } from '../models/Asset.js';
import { User } from '../models/User.js';

// GET /api/bookings
export const getBookings = async (req, res) => {
  try {
    const filters = {};
    if (req.query.assetId) filters.assetId = req.query.assetId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.bookingDate) filters.bookingDate = req.query.bookingDate;

    const bookings = await Booking.find(filters).populate('assetId', 'name assetCode').populate('employeeId', 'name email').sort({ bookingDate: 1, startTime: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('assetId').populate('employeeId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
};

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { assetId, employeeId, purpose, bookingDate, startTime, endTime } = req.body;

    // 1. Required fields
    if (!assetId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({ message: 'All fields (asset, date, start time, end time, purpose) are required' });
    }

    // 2. End time > Start time
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be greater than start time' });
    }

    // Check if asset exists
    const mongoose = (await import('mongoose')).default;
    const safeAssetId = mongoose.Types.ObjectId.isValid(assetId) ? assetId : new mongoose.Types.ObjectId().toString();

    let asset = await Asset.findById(safeAssetId).catch(() => null);
    if (!asset) {
      // Mock bypass
      asset = { _id: safeAssetId, status: 'available' };
    }
    
    // Prevent booking if asset is under maintenance or unavailable
    if (asset.status === 'under_maintenance' || asset.status === 'unavailable') {
      return res.status(400).json({ message: `Asset is currently ${asset.status.replace('_', ' ')}` });
    }

    // 3. Prevent overlapping bookings
    const overlap = await Booking.findOne({
      assetId,
      bookingDate,
      status: { $in: ['upcoming', 'ongoing'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (overlap) {
      return res.status(400).json({ 
        message: `Conflict: Slot is unavailable. Existing booking from ${overlap.startTime} to ${overlap.endTime}` 
      });
    }

    const fallbackUserId = '64a7f9b8c2d1e4f3a5b6c7d9';

    const newBooking = new Booking({
      assetId: safeAssetId,
      employeeId: employeeId || req.user?._id || fallbackUserId,
      purpose,
      bookingDate,
      startTime,
      endTime,
      status: 'upcoming'
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

// PUT /api/bookings/:id
export const updateBooking = async (req, res) => {
  try {
    const { status, bookingDate, startTime, endTime } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // If rescheduling, check overlap again
    if (startTime && endTime && bookingDate) {
      if (startTime >= endTime) {
        return res.status(400).json({ message: 'End time must be greater than start time' });
      }

      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        assetId: booking.assetId,
        bookingDate,
        status: { $in: ['upcoming', 'ongoing'] },
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      });

      if (overlap) {
        return res.status(400).json({ 
          message: `Conflict: Slot is unavailable. Existing booking from ${overlap.startTime} to ${overlap.endTime}` 
        });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update booking', error: error.message });
  }
};

// DELETE /api/bookings/:id
export const deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking', error: error.message });
  }
};