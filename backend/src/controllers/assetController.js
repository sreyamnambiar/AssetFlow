import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// Create Asset
export const createAsset = asyncHandler(async (req, res) => {
  const { name, assetCode, category, location, status, notes } = req.body;

  if (!name || !assetCode) {
    return res.status(400).json({ success: false, message: "Asset name and asset code are required" });
  }

  // Handle unique-index conflict
  const existingAsset = await Asset.findOne({ assetCode });
  if (existingAsset) {
    return res.status(409).json({ success: false, message: "Asset code already exists" });
  }

  const asset = await Asset.create({ name, assetCode, category, location, status, notes });
  return sendSuccess(res, { data: asset, message: "Asset created successfully", statusCode: 201 });
});

// Get all Assets (using the HEAD advanced filtering logic)
export const getAssets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.bookable === 'true') filter.status = 'available';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { assetCode: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const data = await Asset.find(filter).sort({ name: 1 });
  sendSuccess(res, { data });
});

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
  return sendSuccess(res, { data: asset, message: "Asset fetched successfully" });
});

export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
  return sendSuccess(res, { data: asset, message: "Asset updated successfully" });
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndDelete(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
  return sendSuccess(res, { data: null, message: "Asset deleted successfully" });
});