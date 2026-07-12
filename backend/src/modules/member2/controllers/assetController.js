import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Asset, { ASSET_STATUSES, ASSET_CATEGORIES } from "../models/Asset.js";
import AssetHistory from "../models/AssetHistory.js";
import { AppError } from "../../../utils/AppError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.js";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the display name of the current request user.
 * Falls back to "system" when no user is attached (should not happen on
 * protected routes, but keeps history writes safe).
 */
const actorFrom = (req) =>
  req.user?.name || req.user?.email || req.user?.id || "system";

/**
 * Append one record to the AssetHistory collection.
 *
 * @param {string|ObjectId} assetId
 * @param {string}          action   - One of HISTORY_ACTIONS
 * @param {string}          actor    - Who performed the action
 * @param {object}          details  - Arbitrary metadata (before/after, etc.)
 */
const logHistory = (assetId, action, actor, details = {}) =>
  AssetHistory.create({ asset: assetId, action, performedBy: actor, details });

/**
 * Validate that a string is a valid Mongo ObjectId.
 * Throws AppError 400 if not.
 */
const assertObjectId = (id, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} format`, 400);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Create Asset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new asset
 * @route   POST /api/assets
 * @access  Private
 * @body    { name, assetCode, category, location, status, purchaseDate, purchasePrice, notes }
 * @returns 201 – { success, message, data: asset }
 * @error   400 – Missing required fields, duplicate assetCode, invalid enum values
 *          401 – Unauthorized
 */
export const createAsset = asyncHandler(async (req, res) => {
  const {
    name,
    assetCode,
    category,
    location,
    status,
    purchaseDate,
    purchasePrice,
    notes,
  } = req.body;

  // ── Required field validation ─────────────────────────────────────────────
  if (!name || !String(name).trim()) {
    throw new AppError("Asset name is required", 400);
  }
  if (!assetCode || !String(assetCode).trim()) {
    throw new AppError("Asset code is required", 400);
  }

  // ── Enum validation ───────────────────────────────────────────────────────
  if (status && !ASSET_STATUSES.includes(status)) {
    throw new AppError(
      `Invalid status "${status}". Valid values: ${ASSET_STATUSES.join(", ")}`,
      400
    );
  }
  if (category && !ASSET_CATEGORIES.includes(category)) {
    throw new AppError(
      `Invalid category "${category}". Valid values: ${ASSET_CATEGORIES.join(", ")}`,
      400
    );
  }

  // ── Duplicate check ───────────────────────────────────────────────────────
  const existing = await Asset.findOne({ assetCode: assetCode.trim() });
  if (existing) {
    throw new AppError(
      `Asset code "${assetCode.trim()}" already exists`,
      400
    );
  }

  const asset = await Asset.create({
    name: name.trim(),
    assetCode: assetCode.trim(),
    category: category?.trim(),
    location: location?.trim(),
    status: status?.trim(),
    purchaseDate: purchaseDate || undefined,
    purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : undefined,
    notes: notes?.trim(),
  });

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logHistory(asset._id, "Created", actorFrom(req), { asset });

  return sendSuccess(res, {
    data: asset,
    message: "Asset created successfully",
    statusCode: 201,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get All Assets  (search + filter + pagination + sorting)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    List assets with search, filter, pagination, and sorting
 * @route   GET /api/assets
 * @access  Private
 * @query   search    – partial match on name or assetCode (case-insensitive)
 *          category  – exact match on category
 *          status    – exact match on status
 *          location  – exact match on location
 *          page      – page number (default: 1)
 *          limit     – records per page (default: 10, max: 100)
 *          sortBy    – field to sort by (default: createdAt)
 *          order     – "asc" | "desc" (default: desc)
 * @returns 200 – { success, message, data: assets[], meta: { currentPage, totalPages, totalAssets, limit } }
 */
export const getAssets = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    status,
    location,
    page: rawPage = "1",
    limit: rawLimit = "10",
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  // ── Pagination params ─────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10));
  const skip = (page - 1) * limit;

  // ── Build query filter ────────────────────────────────────────────────────
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { assetCode: regex }];
  }

  if (category && category.trim()) filter.category = category.trim();
  if (status && status.trim()) filter.status = status.trim();
  if (location && location.trim()) filter.location = location.trim();

  // ── Sorting ───────────────────────────────────────────────────────────────
  const SORTABLE_FIELDS = ["name", "assetCode", "category", "status", "location", "createdAt", "updatedAt", "purchaseDate", "purchasePrice"];
  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = order === "asc" ? 1 : -1;
  const sortOption = { [sortField]: sortDirection };

  // ── Execute queries in parallel ───────────────────────────────────────────
  const [assets, totalAssets] = await Promise.all([
    Asset.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Asset.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalAssets / limit);

  return sendSuccess(res, {
    data: assets,
    message: "Assets fetched successfully",
    meta: {
      currentPage: page,
      totalPages,
      totalAssets,
      limit,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Asset By ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get a single asset by MongoDB ObjectId
 * @route   GET /api/assets/:id
 * @access  Private
 * @returns 200 – { success, message, data: asset }
 * @error   400 – Invalid ObjectId
 *          404 – Asset not found
 */
export const getAssetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "asset ID");

  const asset = await Asset.findById(id);
  if (!asset) throw new AppError("Asset not found", 404);

  return sendSuccess(res, { data: asset, message: "Asset fetched successfully" });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Update Asset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update an existing asset
 * @route   PUT /api/assets/:id
 * @access  Private
 * @body    Any subset of { name, assetCode, category, location, status, purchaseDate, purchasePrice, notes }
 * @returns 200 – { success, message, data: updatedAsset }
 * @error   400 – Validation errors, duplicate assetCode
 *          404 – Asset not found
 */
export const updateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "asset ID");

  // ── Field-level validation ────────────────────────────────────────────────
  if (req.body.name !== undefined && !String(req.body.name).trim()) {
    throw new AppError("Asset name cannot be empty", 400);
  }
  if (req.body.assetCode !== undefined && !String(req.body.assetCode).trim()) {
    throw new AppError("Asset code cannot be empty", 400);
  }
  if (req.body.status && !ASSET_STATUSES.includes(req.body.status)) {
    throw new AppError(
      `Invalid status "${req.body.status}". Valid values: ${ASSET_STATUSES.join(", ")}`,
      400
    );
  }
  if (req.body.category && !ASSET_CATEGORIES.includes(req.body.category)) {
    throw new AppError(
      `Invalid category "${req.body.category}". Valid values: ${ASSET_CATEGORIES.join(", ")}`,
      400
    );
  }

  // ── Duplicate assetCode check (exclude self) ──────────────────────────────
  if (req.body.assetCode) {
    const dup = await Asset.findOne({
      assetCode: req.body.assetCode.trim(),
      _id: { $ne: id },
    });
    if (dup) throw new AppError(`Asset code "${req.body.assetCode.trim()}" already exists`, 400);
  }

  // ── Build sanitised update payload ────────────────────────────────────────
  const ALLOWED_FIELDS = [
    "name", "assetCode", "category", "location", "status",
    "purchaseDate", "purchasePrice", "notes",
  ];
  const updateData = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updateData[field] =
        typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
    }
  }

  const before = await Asset.findById(id).lean();
  if (!before) throw new AppError("Asset not found", 404);

  const asset = await Asset.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logHistory(id, "Updated", actorFrom(req), { before, after: updateData });

  return sendSuccess(res, { data: asset, message: "Asset updated successfully" });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Delete Asset
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Delete an asset by ID
 * @route   DELETE /api/assets/:id
 * @access  Private
 * @returns 200 – { success, message, data: null }
 * @error   400 – Invalid ObjectId
 *          404 – Asset not found
 */
export const deleteAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "asset ID");

  const asset = await Asset.findByIdAndDelete(id);
  if (!asset) throw new AppError("Asset not found", 404);

  // ── Audit log (history persists after deletion) ───────────────────────────
  await logHistory(id, "Deleted", actorFrom(req), {
    deletedAsset: { name: asset.name, assetCode: asset.assetCode },
  });

  return sendSuccess(res, { data: null, message: "Asset deleted successfully" });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Dashboard Statistics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Return high-level asset counts grouped by status
 * @route   GET /api/assets/stats
 * @access  Private
 * @returns 200 – { success, message, data: { total, available, assigned, maintenance, retired } }
 */
export const getAssetStats = asyncHandler(async (_req, res) => {
  const stats = await Asset.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    retired: 0,
  };

  for (const { _id, count } of stats) {
    result.total += count;
    const key = _id ? _id.toLowerCase() : null;
    if (key && key in result) result[key] = count;
  }

  return sendSuccess(res, {
    data: result,
    message: "Asset statistics fetched successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Asset History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Retrieve the full audit trail for a single asset
 * @route   GET /api/assets/:id/history
 * @access  Private
 * @returns 200 – { success, message, data: history[] }
 * @error   400 – Invalid ObjectId
 *          404 – Asset not found
 */
export const getAssetHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "asset ID");

  // Verify asset existence (gives a proper 404 if the asset doesn't exist)
  const assetExists = await Asset.exists({ _id: id });
  if (!assetExists) throw new AppError("Asset not found", 404);

  const history = await AssetHistory.find({ asset: id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    data: history,
    message: "Asset history fetched successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Export Assets to Excel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Stream all assets (optionally filtered) as an Excel (.xlsx) file
 * @route   GET /api/assets/export
 * @access  Private
 * @query   Same search / filter params as GET /api/assets (search, category, status, location)
 * @returns Binary .xlsx download
 */
export const exportAssets = asyncHandler(async (req, res) => {
  const { search, category, status, location } = req.query;

  // ── Build the same filter as getAssets ────────────────────────────────────
  const filter = {};
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { assetCode: regex }];
  }
  if (category && category.trim()) filter.category = category.trim();
  if (status && status.trim()) filter.status = status.trim();
  if (location && location.trim()) filter.location = location.trim();

  const assets = await Asset.find(filter).sort({ name: 1 }).lean();

  // ── Build workbook ────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AssetFlow";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Assets");

  // Column definitions
  sheet.columns = [
    { header: "Asset Code", key: "assetCode", width: 18 },
    { header: "Name", key: "name", width: 30 },
    { header: "Category", key: "category", width: 16 },
    { header: "Location", key: "location", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Purchase Date", key: "purchaseDate", width: 16 },
    { header: "Purchase Price", key: "purchasePrice", width: 16 },
    { header: "Notes", key: "notes", width: 35 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3A5F" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  // Add data rows
  for (const asset of assets) {
    sheet.addRow({
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category || "",
      location: asset.location || "",
      status: asset.status || "",
      purchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toLocaleDateString()
        : "",
      purchasePrice:
        asset.purchasePrice !== undefined ? asset.purchasePrice : "",
      notes: asset.notes || "",
      createdAt: asset.createdAt
        ? new Date(asset.createdAt).toLocaleString()
        : "",
    });
  }

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // ── Stream to response ────────────────────────────────────────────────────
  const filename = `assets_export_${Date.now()}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Import Assets from Excel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Import assets from an uploaded Excel file
 * @route   POST /api/assets/import
 * @access  Private
 * @body    multipart/form-data  field: "file" (.xlsx / .xls)
 *
 * Expected columns (row 1 = headers):
 *   Asset Code | Name | Category | Location | Status | Purchase Date | Purchase Price | Notes
 *
 * Behaviour:
 *   - Skips rows where assetCode already exists in the DB (duplicate).
 *   - Skips rows that fail validation (empty name/code, invalid enum).
 *   - Returns counts and a list of failed records with reasons.
 *
 * @returns 200 – { success, message, data: { imported, skipped, failed[] } }
 */
export const importAssets = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded. Send an Excel file in field 'file'", 400);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new AppError("The uploaded Excel file contains no worksheets", 400);
  }

  // ── Map header names to column indices ────────────────────────────────────
  const headerRow = sheet.getRow(1);
  const colIndex = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    colIndex[key] = colNumber;
  });

  const get = (row, key) => {
    const idx = colIndex[key];
    if (!idx) return undefined;
    const val = row.getCell(idx).value;
    if (val === null || val === undefined) return undefined;
    return typeof val === "object" && val.text ? String(val.text).trim() : String(val).trim();
  };

  // ── Collect all assetCodes currently in DB for O(1) dup check ────────────
  const existingCodes = new Set(
    (await Asset.find({}, "assetCode").lean()).map((a) => a.assetCode)
  );

  const toInsert = [];
  const failed = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const assetCode = get(row, "assetcode");
    const name = get(row, "name");
    const category = get(row, "category");
    const location = get(row, "location");
    const status = get(row, "status");
    const purchaseDateRaw = get(row, "purchasedate");
    const purchasePriceRaw = get(row, "purchaseprice");
    const notes = get(row, "notes");

    // ── Row-level validation ──────────────────────────────────────────────
    if (!name) {
      failed.push({ row: rowNumber, assetCode, reason: "Name is required" });
      return;
    }
    if (!assetCode) {
      failed.push({ row: rowNumber, name, reason: "Asset code is required" });
      return;
    }
    if (existingCodes.has(assetCode)) {
      failed.push({ row: rowNumber, assetCode, reason: "Duplicate asset code – skipped" });
      return;
    }
    if (status && !ASSET_STATUSES.includes(status)) {
      failed.push({
        row: rowNumber,
        assetCode,
        reason: `Invalid status "${status}". Valid: ${ASSET_STATUSES.join(", ")}`,
      });
      return;
    }
    if (category && !ASSET_CATEGORIES.includes(category)) {
      failed.push({
        row: rowNumber,
        assetCode,
        reason: `Invalid category "${category}". Valid: ${ASSET_CATEGORIES.join(", ")}`,
      });
      return;
    }

    const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : undefined;
    const purchasePrice =
      purchasePriceRaw && !isNaN(Number(purchasePriceRaw))
        ? Number(purchasePriceRaw)
        : undefined;

    toInsert.push({ name, assetCode, category, location, status, purchaseDate, purchasePrice, notes });
    // Track the code to catch duplicates within the same sheet
    existingCodes.add(assetCode);
  });

  // ── Bulk insert ───────────────────────────────────────────────────────────
  let imported = 0;
  if (toInsert.length > 0) {
    const inserted = await Asset.insertMany(toInsert, { ordered: false });
    imported = inserted.length;

    // Log history for each imported asset
    const historyDocs = inserted.map((asset) => ({
      asset: asset._id,
      action: "Created",
      performedBy: actorFrom(req),
      details: { source: "Excel Import" },
    }));
    await AssetHistory.insertMany(historyDocs);
  }

  return sendSuccess(res, {
    data: {
      imported,
      skipped: failed.length,
      failed,
    },
    message: `Import complete. ${imported} asset(s) imported, ${failed.length} skipped.`,
  });
});