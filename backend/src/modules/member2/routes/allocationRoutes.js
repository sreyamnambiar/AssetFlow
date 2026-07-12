import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  returnAsset,
} from "../controllers/allocationController.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// All routes are protected by JWT authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/assign        – Create a new asset assignment
 * GET  /api/assign        – List all assignments (supports ?status=Active|Returned &page= &limit=)
 */
router.post("/assign", requireAuth, createAssignment);
router.get("/assign", requireAuth, getAssignments);

/**
 * GET    /api/assign/:id  – Fetch a single assignment (asset details populated)
 * PUT    /api/assign/:id  – Update assignment metadata
 * DELETE /api/assign/:id  – Delete an assignment (auto-frees the asset if active)
 */
router.get("/assign/:id", requireAuth, getAssignmentById);
router.put("/assign/:id", requireAuth, updateAssignment);
router.delete("/assign/:id", requireAuth, deleteAssignment);

/**
 * PUT /api/return/:assignmentId
 * Mark an assignment as Returned and set the asset status back to "Available".
 * Body: { returnDate?: ISO8601, notes?: string }
 */
router.put("/return/:assignmentId", requireAuth, returnAsset);

export default router;