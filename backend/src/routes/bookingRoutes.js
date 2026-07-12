import { Router } from 'express';
import { 
  getBookings, 
  getBookingById, 
  createBooking, 
  updateBooking, 
  deleteBooking 
} from '../controllers/bookingController.js';

const router = Router();

router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;