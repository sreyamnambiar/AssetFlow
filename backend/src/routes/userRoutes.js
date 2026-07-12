import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getTechnicians } from '../controllers/maintenanceController.js';

const router = Router();

router.get('/technicians', requireAuth, getTechnicians);

export default router;