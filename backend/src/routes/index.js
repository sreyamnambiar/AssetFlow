import { Router } from 'express';
import assetRoutes from './assetRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import userRoutes from './userRoutes.js';
import auditRoutes from './auditRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

// Mount active feature routes
router.use('/assets',      assetRoutes);
router.use('/bookings',    bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/users',       userRoutes);
router.use('/audit',       auditRoutes);
router.use('/reports',     reportRoutes);

export default router;