import { Router } from 'express';
import assetRoutes from './assetRoutes.js';
import allocationRoutes from './allocationRoutes.js';

const router = Router();

router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);

export default router;