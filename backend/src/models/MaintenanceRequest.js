import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issueDescription: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], required: true, index: true },
    image: { type: String, default: '' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'technician_assigned', 'in_progress', 'resolved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    approvedAt: { type: Date },
    resolvedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true, collection: 'maintenance_requests' }
);

maintenanceSchema.index({ assetId: 1, status: 1, createdAt: -1 });

export const MaintenanceRequest =
  mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', maintenanceSchema);