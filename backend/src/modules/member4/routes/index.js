import { Router } from 'express';
import auditRoutes from './auditRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

router.use('/audits', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;