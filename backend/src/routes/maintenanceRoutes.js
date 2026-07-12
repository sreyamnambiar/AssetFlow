import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  addMaintenanceRequest,
  editMaintenanceRequest,
  getMaintenance,
  getMaintenanceRequest,
  getTechnicians,
  removeMaintenanceRequest,
} from '../controllers/maintenanceController.js';
import {
  validateMaintenanceCreate,
  validateMaintenanceId,
  validateMaintenanceQuery,
  validateMaintenanceUpdate,
} from '../validators/maintenanceValidator.js';

const router = Router();

const uploadDir = path.resolve('uploads/maintenance');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get('/technicians', requireAuth, getTechnicians);
router.get('/', requireAuth, validateMaintenanceQuery, getMaintenance);
router.get('/:id', requireAuth, validateMaintenanceId, getMaintenanceRequest);
router.post('/', requireAuth, upload.single('image'), validateMaintenanceCreate, addMaintenanceRequest);
router.put('/:id', requireAuth, upload.single('image'), validateMaintenanceId, validateMaintenanceUpdate, editMaintenanceRequest);
router.delete('/:id', requireAuth, validateMaintenanceId, removeMaintenanceRequest);

export default router;