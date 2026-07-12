import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetRecord',
      required: [true, 'Asset reference is required'],
    },
    fromEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fromDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    toDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    transferDate: {
      type: Date,
      required: [true, 'Transfer date is required'],
      default: Date.now,
    },
    reason: {
      type: String,
      required: [true, 'Reason for transfer is required'],
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Approved by is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Rejected'],
      default: 'Completed',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'transfers',
  }
);

transferSchema.index({ asset: 1 });
transferSchema.index({ fromEmployee: 1 });
transferSchema.index({ toEmployee: 1 });
transferSchema.index({ fromDepartment: 1 });
transferSchema.index({ toDepartment: 1 });

export const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);
