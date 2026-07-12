import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  addCycle,
  getCycle,
  getCycles,
  getAuditors,
} from '../controllers/auditController.js';
import {
  validateAuditId,
  validateAuditCycleCreate,
} from '../validators/auditValidator.js';

const router = Router();

router.get('/cycles', requireAuth, getCycles);
router.get('/auditors', requireAuth, getAuditors);
router.get('/:id', requireAuth, validateAuditId, getCycle);
router.post('/cycle', requireAuth, validateAuditCycleCreate, addCycle);

export default router;
