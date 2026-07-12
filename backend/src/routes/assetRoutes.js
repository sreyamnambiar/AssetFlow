import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getAssets, createAsset, getAssetById, updateAsset, deleteAsset } from '../controllers/assetController.js';

const router = Router();

router.route('/')
  .get(requireAuth, getAssets)
  .post(requireAuth, createAsset);

router.route('/:id')
  .get(requireAuth, getAssetById)
  .put(requireAuth, updateAsset)
  .delete(requireAuth, deleteAsset);

export default router;