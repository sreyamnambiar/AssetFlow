import { AuditCycle, AuditRecord } from '../models/Audit.js';
import { Asset } from '../models/Asset.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function createAuditCycle(payload) {
  const auditCycle = await AuditCycle.create({
    name: payload.name,
    department: payload.department,
    location: payload.location,
    startDate: payload.startDate,
    endDate: payload.endDate,
    auditors: payload.auditors || [],
    status: 'active',
  });

  // Find assets matching the location or department
  let assets = [];
  if (payload.location) {
    assets = await Asset.find({
      location: { $regex: payload.location, $options: 'i' }
    });
  }

  // Fallback: If no assets match, fetch the first 10 assets in the database to populate the checklist
  if (assets.length === 0) {
    assets = await Asset.find().limit(10);
  }

  const records = assets.map((asset) => ({
    auditCycleId: auditCycle._id,
    assetId: asset._id,
    expectedLocation: asset.location || 'N/A',
    status: 'pending',
  }));

  if (records.length > 0) {
    await AuditRecord.insertMany(records);
  }

  return getAuditCycleById(auditCycle._id);
}

export async function listAuditCycles(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AuditCycle.find()
      .populate('auditors', 'name email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditCycle.countDocuments(),
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

export async function getAuditCycleById(id) {
  const auditCycle = await AuditCycle.findById(id).populate('auditors', 'name email role department');
  if (!auditCycle) {
    throw new AppError('Audit cycle not found', 404);
  }

  const records = await AuditRecord.find({ auditCycleId: id })
    .populate('assetId', 'name assetCode category location status')
    .populate('verifiedBy', 'name email role');

  return {
    ...auditCycle.toObject(),
    records,
  };
}

export async function listAuditors() {
  return User.find()
    .select('name email role department')
    .sort({ name: 1 });
}
