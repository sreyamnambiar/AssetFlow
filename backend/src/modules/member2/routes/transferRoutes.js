import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import {
  createTransfer,
  getAllTransfers,
  getTransferById,
} from "../controllers/transferController.js";

const router = Router();

router.use(requireAuth);

router.post("/", createTransfer);
router.get("/", getAllTransfers);
router.get("/:id", getTransferById);

export default router;
