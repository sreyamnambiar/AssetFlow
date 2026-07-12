import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  addCycle,
  getCycle,
  getCycles,
  getAuditors,
  verifyRecord,
  closeCycle,
  getHistory,
} from '../controllers/auditController.js';
import {
  validateAuditId,
  validateAuditCycleCreate,
  validateVerifyRecord,
  validateCloseAudit,
} from '../validators/auditValidator.js';

const router = Router();

router.get('/cycles',          requireAuth, getCycles);
router.get('/auditors',        requireAuth, getAuditors);
router.get('/history',         requireAuth, getHistory);
router.get('/:id',             requireAuth, validateAuditId,     getCycle);
router.post('/cycle',          requireAuth, validateAuditCycleCreate, addCycle);
router.post('/:id/verify',     requireAuth, validateVerifyRecord, verifyRecord);
router.post('/:id/close',      requireAuth, validateCloseAudit,  closeCycle);

export default router;
