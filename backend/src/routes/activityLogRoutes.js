import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getActivityLogs } from '../controllers/activityLogController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getActivityLogs);
router.get('/filter', getActivityLogs); // The controller handles req.query filtering for both

export default router;
