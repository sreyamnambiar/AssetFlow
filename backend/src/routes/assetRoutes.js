import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getAssets } from '../controllers/assetController.js';

const router = Router();

router.get('/', requireAuth, getAssets);

export default router;