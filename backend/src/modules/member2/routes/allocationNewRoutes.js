import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import {
  createAllocation,
  getAllAllocations,
  getAllocationById,
  updateAllocation,
  returnAllocation,
  deleteAllocation,
} from "../controllers/allocationNewController.js";

const router = Router();

router.use(requireAuth);

router.post("/", createAllocation);
router.get("/", getAllAllocations);
router.get("/:id", getAllocationById);
router.put("/:id", updateAllocation);
router.put("/:id/return", returnAllocation);
router.delete("/:id", deleteAllocation);

export default router;
