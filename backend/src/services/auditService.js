import { AuditCycle, AuditRecord, AuditDiscrepancy } from '../models/Audit.js';
import { Asset } from '../models/Asset.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/* ─── Create Audit Cycle ────────────────────────────────────── */
export async function createAuditCycle(payload) {
  const auditCycle = await AuditCycle.create({
    name:       payload.name,
    department: payload.department,
    location:   payload.location,
    startDate:  payload.startDate,
    endDate:    payload.endDate,
    auditors:   payload.auditors || [],
    status:     'active',
  });

  // Find assets matching the location or department
  let assets = await Asset.find({
    $or: [
      { location:   { $regex: payload.location,   $options: 'i' } },
      { category:   { $regex: payload.department, $options: 'i' } },
    ],
  });

  // Fallback: If no assets match, fetch the first 10 assets
  if (assets.length === 0) {
    assets = await Asset.find().limit(10);
  }

  const records = assets.map((asset) => ({
    auditCycleId:     auditCycle._id,
    assetId:          asset._id,
    expectedLocation: asset.location || 'N/A',
    status:           'pending',
  }));

  if (records.length > 0) {
    await AuditRecord.insertMany(records);
  }

  return getAuditCycleById(auditCycle._id);
}

/* ─── List Audit Cycles (active) ────────────────────────────── */
export async function listAuditCycles(query = {}) {
  const page  = Math.max(Number(query.page)  || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip  = (page - 1) * limit;

  const filter = { status: 'active' };

  const [items, total] = await Promise.all([
    AuditCycle.find(filter)
      .populate('auditors', 'name email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditCycle.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/* ─── Get single Audit Cycle with records ───────────────────── */
export async function getAuditCycleById(id) {
  const auditCycle = await AuditCycle.findById(id)
    .populate('auditors', 'name email role department');

  if (!auditCycle) {
    throw new AppError('Audit cycle not found', 404);
  }

  const records = await AuditRecord.find({ auditCycleId: id })
    .populate('assetId', 'name assetCode category location status')
    .populate('verifiedBy', 'name email role');

  const discrepancies = await AuditDiscrepancy.find({ auditCycleId: id })
    .populate('assetId', 'name assetCode category location');

  return {
    ...auditCycle.toObject(),
    records,
    discrepancies,
  };
}

/* ─── Verify / update a single asset record ─────────────────── */
export async function verifyAssetRecord(cycleId, recordId, { status, notes }) {
  const cycle = await AuditCycle.findById(cycleId);
  if (!cycle) throw new AppError('Audit cycle not found', 404);
  if (cycle.status === 'closed') throw new AppError('Cannot update a closed audit cycle', 400);

  const record = await AuditRecord.findOne({ _id: recordId, auditCycleId: cycleId });
  if (!record) throw new AppError('Audit record not found in this cycle', 404);

  const prevStatus = record.status;
  record.status     = status;
  record.notes      = notes || record.notes;
  record.verifiedAt = new Date();
  await record.save();

  // Auto-generate discrepancy for missing / damaged
  if ((status === 'missing' || status === 'damaged') && prevStatus !== status) {
    await AuditDiscrepancy.findOneAndUpdate(
      { auditCycleId: cycleId, auditRecordId: recordId },
      {
        auditCycleId:  cycleId,
        auditRecordId: recordId,
        assetId:       record.assetId,
        type:          status,
        notes:         notes || '',
        reportedAt:    new Date(),
        resolved:      false,
      },
      { upsert: true, new: true }
    );
  }

  // Remove discrepancy if status changed to verified/pending
  if (status === 'verified' || status === 'pending') {
    await AuditDiscrepancy.deleteOne({ auditCycleId: cycleId, auditRecordId: recordId });
  }

  return getAuditCycleById(cycleId);
}

/* ─── Close Audit Cycle ──────────────────────────────────────── */
export async function closeAuditCycle(cycleId) {
  const cycle = await AuditCycle.findById(cycleId);
  if (!cycle) throw new AppError('Audit cycle not found', 404);
  if (cycle.status === 'closed') throw new AppError('Audit cycle is already closed', 400);

  cycle.status   = 'closed';
  cycle.closedAt = new Date();
  await cycle.save();

  return getAuditCycleById(cycleId);
}

/* ─── Audit History (closed cycles) ─────────────────────────── */
export async function getAuditHistory(query = {}) {
  const page  = Math.max(Number(query.page)  || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip  = (page - 1) * limit;

  const [cycles, total] = await Promise.all([
    AuditCycle.find({ status: 'closed' })
      .populate('auditors', 'name email')
      .sort({ closedAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditCycle.countDocuments({ status: 'closed' }),
  ]);

  // Enrich each closed cycle with record counts
  const items = await Promise.all(
    cycles.map(async (cycle) => {
      const [total, verified, missing, damaged] = await Promise.all([
        AuditRecord.countDocuments({ auditCycleId: cycle._id }),
        AuditRecord.countDocuments({ auditCycleId: cycle._id, status: 'verified' }),
        AuditRecord.countDocuments({ auditCycleId: cycle._id, status: 'missing' }),
        AuditRecord.countDocuments({ auditCycleId: cycle._id, status: 'damaged' }),
      ]);
      return {
        ...cycle.toObject(),
        summary: { total, verified, missing, damaged, pending: total - verified - missing - damaged },
      };
    })
  );

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/* ─── List Auditors ──────────────────────────────────────────── */
export async function listAuditors() {
  return User.find()
    .select('name email role department')
    .sort({ name: 1 });
}
