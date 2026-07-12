import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  addBooking,
  editBooking,
  getBooking,
  getBookings,
  getResources,
  removeBooking,
} from '../controllers/bookingController.js';
import {
  validateBookingCreate,
  validateBookingId,
  validateBookingQuery,
  validateBookingUpdate,
} from '../validators/bookingValidator.js';

const router = Router();

router.get('/resources', requireAuth, getResources);
router.get('/', requireAuth, validateBookingQuery, getBookings);
router.get('/:id', requireAuth, validateBookingId, getBooking);
router.post('/', requireAuth, validateBookingCreate, addBooking);
router.put('/:id', requireAuth, validateBookingId, validateBookingUpdate, editBooking);
router.delete('/:id', requireAuth, validateBookingId, removeBooking);

export default router;