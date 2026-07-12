import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  removeNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/read/:id', markAsRead);
router.delete('/:id', removeNotification);

export default router;
