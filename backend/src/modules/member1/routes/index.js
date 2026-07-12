import { Router } from 'express';
import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import assetCategoryRoutes from './assetCategoryRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/asset-categories', assetCategoryRoutes);

export default router;