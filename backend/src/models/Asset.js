import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    assetCode: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['available', 'in_use', 'under_maintenance', 'unavailable'],
      default: 'available',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'assets' }
);

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);