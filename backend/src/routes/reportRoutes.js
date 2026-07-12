import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  getUtilization,
  getIdleAssets,
  getMaintenanceReport,
  getDepartmentSummary,
  getHeatmap,
  getRetirement,
  getMostUsed,
} from '../controllers/reportController.js';

const router = Router();

router.get('/utilization',        requireAuth, getUtilization);
router.get('/idle-assets',        requireAuth, getIdleAssets);
router.get('/maintenance',        requireAuth, getMaintenanceReport);
router.get('/department-summary', requireAuth, getDepartmentSummary);
router.get('/heatmap',            requireAuth, getHeatmap);
router.get('/retirement',         requireAuth, getRetirement);
router.get('/most-used',          requireAuth, getMostUsed);

export default router;
