import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'activity_logs',
  }
);

activityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
