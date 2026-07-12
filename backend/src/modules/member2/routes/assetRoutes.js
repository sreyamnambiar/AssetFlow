import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import { uploadExcel } from "../utils/upload.js";
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetStats,
  getAssetHistory,
  exportAssets,
  importAssets,
} from "../controllers/assetController.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// All routes are protected by JWT authentication
// ─────────────────────────────────────────────────────────────────────────────

// ── Static / special routes must come BEFORE /:id ────────────────────────────

/**
 * GET /api/assets/stats
 * Dashboard statistics (total, available, assigned, maintenance, retired)
 */
router.get("/stats", requireAuth, getAssetStats);

/**
 * GET /api/assets/export
 * Download all (optionally filtered) assets as an Excel file.
 * Supports: ?search= &category= &status= &location=
 */
router.get("/export", requireAuth, exportAssets);

/**
 * POST /api/assets/import
 * Upload an Excel file (.xlsx/.xls) to bulk-import assets.
 * Field name: "file"
 */
router.post("/import", requireAuth, uploadExcel, importAssets);

// ── Collection CRUD ───────────────────────────────────────────────────────────

/**
 * GET  /api/assets   – List assets (search, filter, paginate, sort)
 * POST /api/assets   – Create a new asset
 */
router.get("/", requireAuth, getAssets);
router.post("/", requireAuth, createAsset);

// ── Document-level routes  (must follow static routes to avoid conflicts) ────

/**
 * GET /api/assets/:id/history
 * Full audit trail for a single asset.
 */
router.get("/:id/history", requireAuth, getAssetHistory);

/**
 * GET    /api/assets/:id  – Fetch one asset
 * PUT    /api/assets/:id  – Update an asset
 * DELETE /api/assets/:id  – Delete an asset
 */
router.get("/:id", requireAuth, getAssetById);
router.put("/:id", requireAuth, updateAsset);
router.delete("/:id", requireAuth, deleteAsset);

export default router;