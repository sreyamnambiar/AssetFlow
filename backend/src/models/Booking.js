import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, required: true, trim: true },
    bookingDate: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    cancelledAt: { type: Date },
  },
  { timestamps: true, collection: 'bookings' }
);

bookingSchema.index({ assetId: 1, bookingDate: 1, startTime: 1, endTime: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);