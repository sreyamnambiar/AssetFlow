import { Router } from "express";
import assetRoutes from "./assetRoutes.js";
import allocationRoutes from "./allocationRoutes.js";
import allocationNewRoutes from "./allocationNewRoutes.js";
import transferRoutes from "./transferRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";

const router = Router();

/**
 * Asset endpoints:
 *   GET    /api/assets
 *   POST   /api/assets
 *   GET    /api/assets/stats
 *   GET    /api/assets/export
 *   POST   /api/assets/import
 *   GET    /api/assets/:id
 *   GET    /api/assets/:id/history
 *   PUT    /api/assets/:id
 *   DELETE /api/assets/:id
 */
router.use("/assets", assetRoutes);

/**
 * New Allocations & Transfers endpoints:
 *   /api/allocations -> CRUD
 *   /api/transfers   -> CRUD/History
 *   /api/dashboard   -> Stats
 */
router.use("/allocations", allocationNewRoutes);
router.use("/transfers", transferRoutes);
router.use("/dashboard", dashboardRoutes);

/**
 * Assignment & Return endpoints (mounted at root so paths are clean):
 *   POST   /api/assign
 *   GET    /api/assign
 *   GET    /api/assign/:id
 *   PUT    /api/assign/:id
 *   DELETE /api/assign/:id
 *   PUT    /api/return/:assignmentId
 */
router.use("/", allocationRoutes);

export default router;