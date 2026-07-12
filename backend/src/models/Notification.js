import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      required: true, 
      enum: ['Alert', 'Approval', 'Booking', 'General'],
      default: 'General' 
    },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'notifications',
  }
);

// Map MongoDB _id to id for frontend consistency
notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
