import { Asset } from '../models/Asset.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getAssets = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.bookable === 'true') {
    filter.status = 'available';
  }

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