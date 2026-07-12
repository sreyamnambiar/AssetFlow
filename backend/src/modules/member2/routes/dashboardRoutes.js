import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getUsers,
  getDepartments,
} from "../controllers/dashboardController.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.get("/departments", getDepartments);

export default router;
