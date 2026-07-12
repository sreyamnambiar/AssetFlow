import { Router } from 'express';

// Import feature routes
import authRoutes from './authRoutes.js';
import assetRoutes from './assetRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import userRoutes from './userRoutes.js';
import auditRoutes from './auditRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';

const router = Router();

// Mount active feature routes
router.use('/auth',        authRoutes);
router.use('/assets',      assetRoutes);
router.use('/bookings',    bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/users',       userRoutes);
router.use('/audit',       auditRoutes);
router.use('/reports',     reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;