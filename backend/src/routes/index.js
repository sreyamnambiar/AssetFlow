import { Router } from 'express';

// Import feature routes
// import authRoutes from './authRoutes.js';
// import departmentRoutes from './departmentRoutes.js';
// import assetRoutes from './assetRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';

const router = Router();

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/departments', departmentRoutes);
// router.use('/assets', assetRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);

export default router;