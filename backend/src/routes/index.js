import { Router } from 'express';

// Import feature routes
import authRoutes from './authRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import userRoutes from './userRoutes.js';
import auditRoutes from './auditRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';

// Member2 – Full-featured Asset Management module
// Handles: /api/assets (CRUD + stats + export/import + history)
//          /api/assign  (assignment workflow)
//          /api/return  (return workflow)
import member2Routes from '../modules/member2/routes/index.js';

const router = Router();

// Mount active feature routes
router.use('/auth',          authRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/maintenance',   maintenanceRoutes);
router.use('/users',         userRoutes);
router.use('/audit',         auditRoutes);
router.use('/reports',       reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);

// Member2 module routes – replaces the old basic /assets route
router.use('/', member2Routes);

export default router;