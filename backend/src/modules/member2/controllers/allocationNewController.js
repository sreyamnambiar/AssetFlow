import mongoose from "mongoose";
import { Allocation } from "../../../models/Allocation.js";
import { Department } from "../../../models/Department.js";
import { User } from "../../../models/User.js";
import Asset from "../models/Asset.js";
import AssetHistory from "../models/AssetHistory.js";
import { AppError } from "../../../utils/AppError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.js";

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
// 1. Allocate Asset (POST /api/allocations)
// ─────────────────────────────────────────────────────────────────────────────
export const createAllocation = asyncHandler(async (req, res) => {
  const { asset, employee, department, expectedReturnDate, remarks } = req.body;

  // Validation: Required fields
  if (!asset) throw new AppError("Asset ID is required", 400);
  if (!employee) throw new AppError("Employee ID is required", 400);
  if (!department) throw new AppError("Department ID is required", 400);
  if (!expectedReturnDate) throw new AppError("Expected return date is required", 400);

  // Validation: Invalid Mongo ObjectId
  assertObjectId(asset, "asset ID");
  assertObjectId(employee, "employee ID");
  assertObjectId(department, "department ID");

  // Validation: Asset exists
  const assetDoc = await Asset.findById(asset);
  if (!assetDoc) throw new AppError("Asset not found", 404);

  // Validation: Employee exists
  const userDoc = await User.findById(employee);
  if (!userDoc) throw new AppError("Employee not found", 404);

  // Validation: Department exists
  const deptDoc = await Department.findById(department);
  if (!deptDoc) throw new AppError("Department not found", 404);

  // Validation: Asset is available before allocation & cannot allocate already allocated
  if (assetDoc.status === "Allocated") {
    throw new AppError("Asset is already allocated", 400);
  }
  if (assetDoc.status !== "Available") {
    throw new AppError(`Asset is not available for allocation (current status: ${assetDoc.status})`, 400);
  }

  const actor = actorFrom(req);
  // Get logged-in user ID if available
  const allocatedByUserId = req.user?.id || req.user?._id;
  if (!allocatedByUserId) {
    throw new AppError("Authentication credentials missing for allocator", 401);
  }

  // Create allocation
  const allocation = await Allocation.create({
    asset,
    employee,
    department,
    allocationDate: new Date(),
    expectedReturnDate: new Date(expectedReturnDate),
    allocatedBy: allocatedByUserId,
    status: "Allocated",
    remarks,
  });

  // Automatically update asset status
  assetDoc.status = "Allocated";
  await assetDoc.save();

  // Audit history
  await logHistory(asset, "Allocated", actor, {
    allocationId: allocation._id,
    employeeName: userDoc.name,
    departmentName: deptDoc.name,
  });

  // Populate references for response
  const populated = await Allocation.findById(allocation._id)
    .populate("asset", "name assetCode category status location")
    .populate("employee", "name email department")
    .populate("department", "name code")
    .populate("allocatedBy", "name email");

  return sendSuccess(res, {
    data: populated,
    message: "Asset allocated successfully",
    statusCode: 201,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get All Allocations (GET /api/allocations)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllAllocations = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    department,
    employee,
    asset,
    category,
    dateFrom,
    dateTo,
    page = "1",
    limit = "10",
    sortBy = "allocationDate",
    order = "desc",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);

  // Build filter object
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (department) {
    assertObjectId(department, "department ID filter");
    filter.department = department;
  }

  if (employee) {
    assertObjectId(employee, "employee ID filter");
    filter.employee = employee;
  }

  if (asset) {
    assertObjectId(asset, "asset ID filter");
    filter.asset = asset;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.allocationDate = {};
    if (dateFrom) filter.allocationDate.$gte = new Date(dateFrom);
    if (dateTo) filter.allocationDate.$lte = new Date(dateTo);
  }

  // Search by Asset Name, Asset Code, Employee Name, Department
  let assetIds = null;
  let employeeIds = null;
  let deptIds = null;

  if (search) {
    const searchRegex = new RegExp(search, "i");

    // Search assets
    const assets = await Asset.find({
      $or: [{ name: searchRegex }, { assetCode: searchRegex }],
    }).select("_id");
    assetIds = assets.map((a) => a._id);

    // Search employees
    const users = await User.find({ name: searchRegex }).select("_id");
    employeeIds = users.map((u) => u._id);

    // Search departments
    const depts = await Department.find({ name: searchRegex }).select("_id");
    deptIds = depts.map((d) => d._id);

    filter.$or = [
      { asset: { $in: assetIds } },
      { employee: { $in: employeeIds } },
      { department: { $in: deptIds } },
    ];
  }

  // Filter by category if provided
  if (category) {
    const categoryAssets = await Asset.find({ category }).select("_id");
    const categoryAssetIds = categoryAssets.map((a) => a._id);
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { asset: { $in: categoryAssetIds } }
      ];
      delete filter.$or;
    } else {
      filter.asset = { $in: categoryAssetIds };
    }
  }

  // Fetch all matching for in-memory sorting (since sorting by nested names is required)
  let query = Allocation.find(filter)
    .populate("asset", "name assetCode category status location")
    .populate("employee", "name email department")
    .populate("department", "name code")
    .populate("allocatedBy", "name email");

  let results = await query.lean();

  // Sorting
  const isDesc = order.toLowerCase() === "desc";
  results.sort((a, b) => {
    let fieldA, fieldB;

    if (sortBy === "assetName" || sortBy === "asset") {
      fieldA = a.asset?.name || "";
      fieldB = b.asset?.name || "";
    } else if (sortBy === "employee") {
      fieldA = a.employee?.name || "";
      fieldB = b.employee?.name || "";
    } else if (sortBy === "department") {
      fieldA = a.department?.name || "";
      fieldB = b.department?.name || "";
    } else if (sortBy === "allocationDate") {
      fieldA = a.allocationDate ? new Date(a.allocationDate).getTime() : 0;
      fieldB = b.allocationDate ? new Date(b.allocationDate).getTime() : 0;
    } else {
      fieldA = a[sortBy] || "";
      fieldB = b[sortBy] || "";
    }

    if (typeof fieldA === "string") {
      return isDesc
        ? fieldB.localeCompare(fieldA)
        : fieldA.localeCompare(fieldB);
    } else {
      return isDesc ? fieldB - fieldA : fieldA - fieldB;
    }
  });

  const totalRecords = results.length;
  const totalPages = Math.ceil(totalRecords / limitNum);
  const paginatedResults = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return sendSuccess(res, {
    data: paginatedResults,
    message: "Allocations fetched successfully",
    meta: {
      currentPage: pageNum,
      totalPages,
      totalRecords,
      limit: limitNum,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Allocation by ID (GET /api/allocations/:id)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllocationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "allocation ID");

  const allocation = await Allocation.findById(id)
    .populate("asset", "name assetCode category status location")
    .populate("employee", "name email department")
    .populate("department", "name code")
    .populate("allocatedBy", "name email")
    .lean();

  if (!allocation) throw new AppError("Allocation not found", 404);

  return sendSuccess(res, {
    data: allocation,
    message: "Allocation details fetched successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Update Allocation (PUT /api/allocations/:id)
// ─────────────────────────────────────────────────────────────────────────────
export const updateAllocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expectedReturnDate, remarks, status } = req.body;

  assertObjectId(id, "allocation ID");

  const allocation = await Allocation.findById(id);
  if (!allocation) throw new AppError("Allocation not found", 404);

  if (expectedReturnDate) {
    allocation.expectedReturnDate = new Date(expectedReturnDate);
  }
  if (remarks !== undefined) {
    allocation.remarks = remarks;
  }
  if (status) {
    if (!["Allocated", "Returned", "Overdue"].includes(status)) {
      throw new AppError("Invalid allocation status value", 400);
    }
    // If status is being updated directly
    allocation.status = status;
  }

  await allocation.save();

  const actor = actorFrom(req);
  await logHistory(allocation.asset, "Updated", actor, {
    allocationId: allocation._id,
    action: "Allocation details updated",
  });

  const populated = await Allocation.findById(allocation._id)
    .populate("asset", "name assetCode category status location")
    .populate("employee", "name email department")
    .populate("department", "name code")
    .populate("allocatedBy", "name email");

  return sendSuccess(res, {
    data: populated,
    message: "Allocation updated successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Return Allocated Asset (PUT /api/allocations/:id/return)
// ─────────────────────────────────────────────────────────────────────────────
export const returnAllocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  assertObjectId(id, "allocation ID");

  const allocation = await Allocation.findById(id);
  if (!allocation) throw new AppError("Allocation not found", 404);

  if (allocation.status === "Returned") {
    throw new AppError("Asset has already been returned for this allocation", 400);
  }

  const actor = actorFrom(req);

  // Update allocation details
  allocation.status = "Returned";
  allocation.actualReturnDate = new Date();
  if (remarks !== undefined) {
    allocation.remarks = remarks;
  }
  await allocation.save();

  // Automatically update asset status to Available
  const assetDoc = await Asset.findById(allocation.asset);
  if (assetDoc) {
    assetDoc.status = "Available";
    await assetDoc.save();
  }

  // Audit history
  await logHistory(allocation.asset, "Returned", actor, {
    allocationId: allocation._id,
    returnDate: allocation.actualReturnDate,
  });

  const populated = await Allocation.findById(allocation._id)
    .populate("asset", "name assetCode category status location")
    .populate("employee", "name email department")
    .populate("department", "name code")
    .populate("allocatedBy", "name email");

  return sendSuccess(res, {
    data: populated,
    message: "Asset returned successfully and status updated to Available",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Delete Allocation (DELETE /api/allocations/:id)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAllocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "allocation ID");

  const allocation = await Allocation.findById(id);
  if (!allocation) throw new AppError("Allocation not found", 404);

  const assetId = allocation.asset;
  const actor = actorFrom(req);

  // If the allocation was active (status is Allocated or Overdue), free the asset
  if (allocation.status !== "Returned") {
    const assetDoc = await Asset.findById(assetId);
    if (assetDoc) {
      assetDoc.status = "Available";
      await assetDoc.save();
    }

    await logHistory(assetId, "Returned", actor, {
      allocationId: id,
      reason: "Allocation deleted and asset auto-returned",
    });
  }

  await allocation.deleteOne();

  return sendSuccess(res, {
    data: null,
    message: "Allocation deleted successfully",
  });
});
