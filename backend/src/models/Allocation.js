import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetRecord',
      required: [true, 'Asset reference is required'],
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    allocationDate: {
      type: Date,
      required: [true, 'Allocation date is required'],
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: [true, 'Expected return date is required'],
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocated by is required'],
    },
    status: {
      type: String,
      enum: ['Allocated', 'Returned', 'Overdue'],
      default: 'Allocated',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'allocations',
  }
);

// Indexes
allocationSchema.index({ asset: 1 });
allocationSchema.index({ employee: 1 });
allocationSchema.index({ department: 1 });
allocationSchema.index({ status: 1 });

export const Allocation = mongoose.models.Allocation || mongoose.model('Allocation', allocationSchema);
