import { Router } from 'express';
import bookingRoutes from './bookingRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';

const router = Router();

router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);

export default router;