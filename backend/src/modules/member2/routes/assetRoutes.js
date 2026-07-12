import { Router } from "express";
import { requireAuth } from "../../../middlewares/authMiddleware.js";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} from "../controllers/assetController.js";

const router = Router();

router.get("/", requireAuth, getAssets);

router.get("/:id", requireAuth, getAssetById);

router.post("/", requireAuth, createAsset);

router.put("/:id", requireAuth, updateAsset);

router.delete("/:id", requireAuth, deleteAsset);

export default router;