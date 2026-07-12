import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import Asset from "../models/Asset.js";
import AssetHistory from "../models/AssetHistory.js";
import { AppError } from "../../../utils/AppError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const actorFrom = (req) =>
  req.user?.name || req.user?.email || req.user?.id || "system";

const assertObjectId = (id, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} format`, 400);
  }
};

const logHistory = (assetId, action, actor, details = {}) =>
  AssetHistory.create({ asset: assetId, action, performedBy: actor, details });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Create Assignment  (POST /api/assign)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Assign an asset to an employee
 * @route   POST /api/assign
 * @access  Private
 * @body    { asset: ObjectId, employee: string, assignedDate?: ISO8601, returnDate?: ISO8601, notes?: string }
 * @returns 201 – { success, message, data: assignment }
 * @error   400 – Missing/invalid fields, asset already assigned
 *          404 – Asset not found
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const { asset: assetId, employee, assignedDate, returnDate, notes } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!assetId) throw new AppError("Asset ID is required", 400);
  assertObjectId(assetId, "asset ID");
  if (!employee || !String(employee).trim()) {
    throw new AppError("Employee name or ID is required", 400);
  }

  // ── Fetch asset ───────────────────────────────────────────────────────────
  const asset = await Asset.findById(assetId);
  if (!asset) throw new AppError("Asset not found", 404);

  if (asset.status === "Assigned") {
    throw new AppError(
      `Asset "${asset.name}" is already assigned. Return it before reassigning.`,
      400
    );
  }
  if (asset.status === "Retired") {
    throw new AppError(`Asset "${asset.name}" is Retired and cannot be assigned.`, 400);
  }

  const actor = actorFrom(req);

  // ── Create assignment ─────────────────────────────────────────────────────
  const assignment = await Assignment.create({
    asset: assetId,
    employee: String(employee).trim(),
    assignedDate: assignedDate || new Date(),
    returnDate: returnDate || null,
    assignedBy: actor,
    status: "Active",
    notes: notes?.trim(),
  });

  // ── Update asset status ───────────────────────────────────────────────────
  await Asset.findByIdAndUpdate(assetId, { status: "Assigned" });

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logHistory(assetId, "Assigned", actor, {
    assignmentId: assignment._id,
    employee: assignment.employee,
    assignedDate: assignment.assignedDate,
  });

  return sendSuccess(res, {
    data: assignment,
    message: "Asset assigned successfully",
    statusCode: 201,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get All Assignments  (GET /api/assign)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    List all assignments with optional status filter and pagination
 * @route   GET /api/assign
 * @access  Private
 * @query   status – "Active" | "Returned"
 *          page   – default 1
 *          limit  – default 10
 * @returns 200 – { success, message, data: assignments[], meta }
 */
export const getAssignments = asyncHandler(async (req, res) => {
  const { status, page: rawPage = "1", limit: rawLimit = "10" } = req.query;

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;

  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .populate("asset", "name assetCode category status location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assignment.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: assignments,
    message: "Assignments fetched successfully",
    meta: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalAssignments: total,
      limit,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Assignment By ID  (GET /api/assign/:id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get a single assignment by ID (with asset details populated)
 * @route   GET /api/assign/:id
 * @access  Private
 * @returns 200 – { success, message, data: assignment }
 * @error   400 – Invalid ObjectId
 *          404 – Assignment not found
 */
export const getAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "assignment ID");

  const assignment = await Assignment.findById(id)
    .populate("asset", "name assetCode category status location")
    .lean();

  if (!assignment) throw new AppError("Assignment not found", 404);

  return sendSuccess(res, {
    data: assignment,
    message: "Assignment fetched successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Update Assignment  (PUT /api/assign/:id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update assignment metadata (employee, dates, notes)
 *          To return an asset, use PUT /api/return/:assignmentId instead.
 * @route   PUT /api/assign/:id
 * @access  Private
 * @body    { employee?, assignedDate?, returnDate?, notes? }
 * @returns 200 – { success, message, data: assignment }
 * @error   400 – Invalid ObjectId, attempt to change asset reference
 *          404 – Assignment not found
 */
export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "assignment ID");

  // Prevent callers from swapping the asset reference through this endpoint
  if (req.body.asset !== undefined) {
    throw new AppError(
      "Cannot change the asset reference on an existing assignment. Delete and create a new one.",
      400
    );
  }

  const ALLOWED = ["employee", "assignedDate", "returnDate", "notes"];
  const updateData = {};
  for (const field of ALLOWED) {
    if (req.body[field] !== undefined) {
      updateData[field] =
        typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
    }
  }

  const assignment = await Assignment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("asset", "name assetCode");

  if (!assignment) throw new AppError("Assignment not found", 404);

  return sendSuccess(res, {
    data: assignment,
    message: "Assignment updated successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Delete Assignment  (DELETE /api/assign/:id)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Delete an assignment record.
 *          If the assignment was Active, the asset status is restored to "Available".
 * @route   DELETE /api/assign/:id
 * @access  Private
 * @returns 200 – { success, message, data: null }
 * @error   400 – Invalid ObjectId
 *          404 – Assignment not found
 */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "assignment ID");

  const assignment = await Assignment.findById(id);
  if (!assignment) throw new AppError("Assignment not found", 404);

  // If still active, free the asset
  if (assignment.status === "Active") {
    await Asset.findByIdAndUpdate(assignment.asset, { status: "Available" });
    await logHistory(
      assignment.asset,
      "Returned",
      actorFrom(req),
      { reason: "Assignment deleted", assignmentId: id }
    );
  }

  await assignment.deleteOne();

  return sendSuccess(res, {
    data: null,
    message: "Assignment deleted successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Return Asset  (PUT /api/return/:assignmentId)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Mark an active assignment as Returned and free the asset
 * @route   PUT /api/return/:assignmentId
 * @access  Private
 * @body    { returnDate?: ISO8601, notes?: string }
 * @returns 200 – { success, message, data: { assignment, asset } }
 * @error   400 – Invalid ObjectId, assignment already returned
 *          404 – Assignment not found
 */
export const returnAsset = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  assertObjectId(assignmentId, "assignment ID");

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError("Assignment not found", 404);

  if (assignment.status === "Returned") {
    throw new AppError("This assignment has already been returned", 400);
  }

  const returnDate = req.body.returnDate
    ? new Date(req.body.returnDate)
    : new Date();

  const actor = actorFrom(req);

  // ── Update assignment ─────────────────────────────────────────────────────
  assignment.status = "Returned";
  assignment.returnDate = returnDate;
  if (req.body.notes) assignment.notes = String(req.body.notes).trim();
  await assignment.save();

  // ── Free the asset ────────────────────────────────────────────────────────
  const asset = await Asset.findByIdAndUpdate(
    assignment.asset,
    { status: "Available" },
    { new: true }
  );

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logHistory(assignment.asset, "Returned", actor, {
    assignmentId: assignment._id,
    employee: assignment.employee,
    returnDate,
  });

  return sendSuccess(res, {
    data: { assignment, asset },
    message: "Asset returned successfully",
  });
});