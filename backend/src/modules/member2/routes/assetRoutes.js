import { Router } from 'express';
import { requireAuth } from '../../../middlewares/authMiddleware.js';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} from '../controllers/assetController.js';

const router = Router();

// Get all assets
router.get('/', requireAuth, getAssets);

// Get single asset
router.get('/:id', requireAuth, getAssetById);

// Create asset
router.post('/', requireAuth, createAsset);

// Update asset
router.put('/:id', requireAuth, updateAsset);

// Delete asset
router.delete('/:id', requireAuth, deleteAsset);

export default router;