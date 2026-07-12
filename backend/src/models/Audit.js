import mongoose from 'mongoose';

/* ── Audit Cycle ─────────────────────────────────────────────── */
const auditCycleSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location:   { type: String, required: true, trim: true },
    startDate:  { type: Date, required: true },
    endDate:    { type: Date, required: true },
    auditors:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      index: true,
    },
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'auditcycles' }
);

/* ── Audit Record (one per asset per cycle) ──────────────────── */
const auditRecordSchema = new mongoose.Schema(
  {
    auditCycleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    assetId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    expectedLocation: { type: String, trim: true, default: 'N/A' },
    status: {
      type: String,
      enum: ['pending', 'verified', 'missing', 'damaged'],
      default: 'pending',
      index: true,
    },
    notes:      { type: String, trim: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true, collection: 'auditrecords' }
);

/* ── Audit Discrepancy (auto-created for missing/damaged) ────── */
const auditDiscrepancySchema = new mongoose.Schema(
  {
    auditCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    auditRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditRecord', required: true },
    assetId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    type: {
      type: String,
      enum: ['missing', 'damaged'],
      required: true,
    },
    notes:      { type: String, trim: true },
    reportedAt: { type: Date, default: Date.now },
    resolved:   { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'auditdiscrepancies' }
);

export const AuditCycle       = mongoose.models.AuditCycle       || mongoose.model('AuditCycle',       auditCycleSchema);
export const AuditRecord      = mongoose.models.AuditRecord      || mongoose.model('AuditRecord',      auditRecordSchema);
export const AuditDiscrepancy = mongoose.models.AuditDiscrepancy || mongoose.model('AuditDiscrepancy', auditDiscrepancySchema);
