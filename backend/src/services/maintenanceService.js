import { Asset } from '../models/Asset.js';
import { MaintenanceRequest } from '../models/MaintenanceRequest.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function buildMaintenanceFilter(query = {}) {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.assetId) filter.assetId = query.assetId;
  if (query.priority) filter.priority = query.priority;

  if (query.search) {
    filter.$or = [
      { issueDescription: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
}

async function assertNoDuplicateMaintenance(assetId) {
  const activeRequest = await MaintenanceRequest.findOne({
    assetId,
    status: { $in: ['pending', 'approved', 'technician_assigned', 'in_progress'] },
  });

  if (activeRequest) {
    throw new AppError('This asset already has an active maintenance request', 400);
  }
}

async function assertAssetExists(assetId) {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    throw new AppError('Selected asset does not exist', 404);
  }
  return asset;
}

function normalizeMaintenance(request) {
  const doc = request.toObject ? request.toObject() : request;
  return doc;
}

export async function listMaintenanceRequests(query) {
  const filter = buildMaintenanceFilter(query);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MaintenanceRequest.find(filter)
      .populate('assetId', 'name assetCode category location status')
      .populate('requestedBy', 'name email role')
      .populate('technician', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MaintenanceRequest.countDocuments(filter),
  ]);

  return {
    items: items.map(normalizeMaintenance),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getMaintenanceById(id) {
  const request = await MaintenanceRequest.findById(id)
    .populate('assetId', 'name assetCode category location status')
    .populate('requestedBy', 'name email role')
    .populate('technician', 'name email role');

  if (!request) {
    throw new AppError('Maintenance request not found', 404);
  }

  return normalizeMaintenance(request);
}

export async function createMaintenanceRequest(payload, requestedBy, imagePath = '') {
  await assertAssetExists(payload.assetId);
  await assertNoDuplicateMaintenance(payload.assetId);

  const asset = await Asset.findById(payload.assetId);
  if (asset.status === 'under_maintenance') {
    throw new AppError('Asset is already under maintenance', 400);
  }

  const request = await MaintenanceRequest.create({
    assetId: payload.assetId,
    requestedBy,
    issueDescription: payload.issueDescription,
    priority: payload.priority,
    image: imagePath,
    status: 'pending',
  });

  return getMaintenanceById(request._id);
}

export async function updateMaintenanceRequest(id, payload, imagePath = undefined) {
  const request = await MaintenanceRequest.findById(id);

  if (!request) {
    throw new AppError('Maintenance request not found', 404);
  }

  if (payload.assetId && `${payload.assetId}` !== `${request.assetId}`) {
    await assertAssetExists(payload.assetId);
    await assertNoDuplicateMaintenance(payload.assetId);
    request.assetId = payload.assetId;
  }

  if (payload.issueDescription) request.issueDescription = payload.issueDescription;
  if (payload.priority) request.priority = payload.priority;
  if (typeof imagePath === 'string') request.image = imagePath;

  if (payload.status) {
    request.status = payload.status;

    if (payload.status === 'approved') {
      request.approvedAt = new Date();
      await Asset.findByIdAndUpdate(request.assetId, { status: 'under_maintenance' });
    }

    if (payload.status === 'technician_assigned') {
      if (!payload.technician) {
        throw new AppError('Technician is required when assigning maintenance', 400);
      }
      request.technician = payload.technician;
    }

    if (payload.status === 'in_progress') {
      if (payload.technician) request.technician = payload.technician;
      if (!request.technician) {
        throw new AppError('Assign a technician before starting work', 400);
      }
    }

    if (payload.status === 'resolved') {
      request.resolvedAt = new Date();
      await Asset.findByIdAndUpdate(request.assetId, { status: 'available' });
    }

    if (payload.status === 'rejected') {
      request.rejectedAt = new Date();
      await Asset.findByIdAndUpdate(request.assetId, { status: 'available' });
    }

    if (payload.status === 'cancelled') {
      request.cancelledAt = new Date();
    }
  }

  await request.save();
  return getMaintenanceById(request._id);
}

export async function deleteMaintenanceRequest(id) {
  const request = await MaintenanceRequest.findById(id);

  if (!request) {
    throw new AppError('Maintenance request not found', 404);
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  await request.save();

  return getMaintenanceById(request._id);
}

export async function listTechnicians() {
  return User.find({ role: { $in: ['technician', 'asset_manager', 'admin'] } })
    .select('name email role department')
    .sort({ name: 1 });
}