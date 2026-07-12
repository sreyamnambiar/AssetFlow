import Asset from "../models/Asset.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.js";


// Create Asset
export const createAsset = asyncHandler(async (req, res) => {
  const {
    name,
    assetCode,
    category,
    location,
    status,
    notes
  } = req.body;

  // Validate required field
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Asset name is required"
    });
  }

  // Create asset
  const asset = await Asset.create({
    name,
    assetCode,
    category,
    location,
    status,
    notes
  });

  return sendSuccess(res, {
    data: asset,
    message: "Asset created successfully",
    statusCode: 201
  });
});


// Get all Assets
export const getAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.find();

  return sendSuccess(res, {
    data: assets,
    message: "Assets fetched successfully"
  });
});


// Get Asset by ID
export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found"
    });
  }

  return sendSuccess(res, {
    data: asset,
    message: "Asset fetched successfully"
  });
});


// Update Asset
export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found"
    });
  }

  return sendSuccess(res, {
    data: asset,
    message: "Asset updated successfully"
  });
});


// Delete Asset
export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByIdAndDelete(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found"
    });
  }

  return sendSuccess(res, {
    data: null,
    message: "Asset deleted successfully"
  });
});