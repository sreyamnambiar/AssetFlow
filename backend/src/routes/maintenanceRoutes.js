import { Router } from 'express';
import { 
  getMaintenanceRequests, 
  getMaintenanceById, 
  createMaintenanceRequest, 
  updateMaintenanceRequest, 
  deleteMaintenanceRequest 
} from '../controllers/maintenanceController.js';

const router = Router();

router.get('/', getMaintenanceRequests);
router.get('/:id', getMaintenanceById);
router.post('/', createMaintenanceRequest);
router.put('/:id', updateMaintenanceRequest);
router.delete('/:id', deleteMaintenanceRequest);

export default router;