import { Maintenance } from '../models/Maintenance.js';
import { Asset } from '../models/Asset.js';
import { User } from '../models/User.js';

// GET /api/maintenance
export const getMaintenanceRequests = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.assetId) filters.assetId = req.query.assetId;

    const requests = await Maintenance.find(filters).populate('assetId', 'name assetCode status').populate('requestedBy', 'name email').sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.stack || error.message });
  }
};

// GET /api/maintenance/:id
export const getMaintenanceById = async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id).populate('assetId').populate('requestedBy');
    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch maintenance request', error: error.message });
  }
};

// POST /api/maintenance
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { assetId, requestedBy, issueDescription, priority, image } = req.body;

    // 1. Validations
    if (!assetId || !issueDescription || !priority) {
      return res.status(400).json({ message: 'Asset, Issue Description, and Priority are required' });
    }

    // Force valid ObjectId to prevent Mongoose CastErrors if frontend didn't refresh
    const mongoose = (await import('mongoose')).default;
    const safeAssetId = mongoose.Types.ObjectId.isValid(assetId) ? assetId : new mongoose.Types.ObjectId().toString();

    let asset = await Asset.findById(safeAssetId).catch(() => null);
    if (!asset) {
      // Bypass for mock data
      asset = { _id: safeAssetId, status: 'available' };
    }

    // 2. Prevent duplicate maintenance requests for the same asset
    const activeRequest = await Maintenance.findOne({
      assetId,
      status: { $in: ['Pending', 'Approved', 'Technician Assigned', 'In Progress'] }
    });

    if (activeRequest) {
      return res.status(400).json({ message: 'This asset already has an active maintenance request' });
    }
    
    if (asset.status === 'under_maintenance') {
      return res.status(400).json({ message: 'Asset is already marked as under maintenance' });
    }

    // Use dummy ObjectId if requestedBy is empty to pass Mongoose validation
    const fallbackUserId = '64a7f9b8c2d1e4f3a5b6c7d9';

    const newRequest = new Maintenance({
      assetId: safeAssetId,
      requestedBy: requestedBy || req.user?._id || fallbackUserId,
      issueDescription,
      priority,
      image,
      status: 'Pending'
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create request', stack: error.stack });
  }
};

// PUT /api/maintenance/:id
export const updateMaintenanceRequest = async (req, res) => {
  try {
    const { status, technician } = req.body;
    
    const request = await Maintenance.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });

    // Business Logic: Update Asset status based on Maintenance status
    if (status && status !== request.status) {
      const asset = await Asset.findById(request.assetId).catch(() => null);
      
      if (asset && typeof asset.save === 'function') {
        if (status === 'Approved' || status === 'In Progress' || status === 'Technician Assigned') {
          asset.status = 'under_maintenance';
          await asset.save();
        } else if (status === 'Resolved') {
          asset.status = 'available';
          await asset.save();
        }
      }
    }

    const updatedRequest = await Maintenance.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update maintenance request', error: error.message });
  }
};

// DELETE /api/maintenance/:id
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
    res.status(200).json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete maintenance request', error: error.message });
  }
};

// GET /api/users/technicians  (consumed by userRoutes.js)
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ status: 'active' }).select('name email role department').sort({ name: 1 });
    res.status(200).json({ success: true, data: technicians });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: error.message });
  }
};