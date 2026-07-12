import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDescription: { type: String, required: true, trim: true },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High'], 
      required: true 
    },
    image: { type: String }, // URL or path
    technician: { type: String, trim: true }, // Can be name or ID
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
      index: true
    }
  },
  { timestamps: true, collection: 'maintenances' }
);

export const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', maintenanceSchema);
