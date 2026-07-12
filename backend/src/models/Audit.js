import mongoose from 'mongoose';

const auditCycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true, collection: 'AuditCycles' }
);

const auditRecordSchema = new mongoose.Schema(
  {
    auditCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    expectedLocation: { type: String, required: true, trim: true },
    verifiedLocation: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'missing', 'damaged'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'AuditRecords' }
);

export const AuditCycle = mongoose.models.AuditCycle || mongoose.model('AuditCycle', auditCycleSchema);
export const AuditRecord = mongoose.models.AuditRecord || mongoose.model('AuditRecord', auditRecordSchema);
