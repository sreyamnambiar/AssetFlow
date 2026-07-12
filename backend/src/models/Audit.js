import mongoose from 'mongoose';

const auditCycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String },
    location: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, default: 'active', enum: ['active', 'completed', 'cancelled'] },
  },
  { timestamps: true }
);

const auditRecordSchema = new mongoose.Schema(
  {
    auditCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    expectedLocation: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'verified', 'missing', 'flagged'] },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);
export const AuditRecord = mongoose.model('AuditRecord', auditRecordSchema);
