import mongoose from "mongoose";
import { Transfer } from "../../../models/Transfer.js";
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
// 1. Transfer Asset (POST /api/transfers)
// ─────────────────────────────────────────────────────────────────────────────
export const createTransfer = asyncHandler(async (req, res) => {
  const { asset, toEmployee, toDepartment, reason, notes } = req.body;

  // Validation: Required fields
  if (!asset) throw new AppError("Asset ID is required", 400);
  if (!toEmployee) throw new AppError("Recipient Employee (toEmployee) ID is required", 400);
  if (!toDepartment) throw new AppError("Recipient Department (toDepartment) ID is required", 400);
  if (!reason) throw new AppError("Reason for transfer is required", 400);

  // Validation: ObjectId format
  assertObjectId(asset, "asset ID");
  assertObjectId(toEmployee, "recipient employee ID");
  assertObjectId(toDepartment, "recipient department ID");

  // Validation: Asset exists
  const assetDoc = await Asset.findById(asset);
  if (!assetDoc) throw new AppError("Asset not found", 404);

  // Validation: Cannot transfer unavailable asset (e.g. Retired, Maintenance)
  if (["Maintenance", "Retired"].includes(assetDoc.status)) {
    throw new AppError(`Cannot transfer asset in status: ${assetDoc.status}`, 400);
  }

  // Validation: Recipient exists
  const toEmployeeDoc = await User.findById(toEmployee);
  if (!toEmployeeDoc) throw new AppError("Recipient employee not found", 404);

  const toDeptDoc = await Department.findById(toDepartment);
  if (!toDeptDoc) throw new AppError("Recipient department not found", 404);

  const approvedByUserId = req.user?.id || req.user?._id;
  if (!approvedByUserId) {
    throw new AppError("Authentication required for approving transfer", 401);
  }

  // Determine current (from) owner and department from active allocation
  const activeAllocation = await Allocation.findOne({
    asset,
    status: { $in: ["Allocated", "Overdue"] },
  });

  let fromEmployee = null;
  let fromDepartment = null;

  if (activeAllocation) {
    fromEmployee = activeAllocation.employee;
    fromDepartment = activeAllocation.department;

    // Automatically complete / return the current allocation
    activeAllocation.status = "Returned";
    activeAllocation.actualReturnDate = new Date();
    activeAllocation.remarks = `Auto-returned due to transfer to ${toEmployeeDoc.name}`;
    await activeAllocation.save();

    await logHistory(asset, "Returned", actorFrom(req), {
      allocationId: activeAllocation._id,
      notes: "Closed automatically by transfer",
    });
  }

  // Create the transfer record
  const transfer = await Transfer.create({
    asset,
    fromEmployee,
    toEmployee,
    fromDepartment,
    toDepartment,
    transferDate: new Date(),
    reason,
    approvedBy: approvedByUserId,
    status: "Completed",
    notes,
  });

  // Automatically create a new allocation for the new employee & department
  // The expected return date is defaulted to 30 days from now, but can be updated
  const expectedReturn = new Date();
  expectedReturn.setDate(expectedReturn.getDate() + 30);

  const newAllocation = await Allocation.create({
    asset,
    employee: toEmployee,
    department: toDepartment,
    allocationDate: new Date(),
    expectedReturnDate: expectedReturn,
    allocatedBy: approvedByUserId,
    status: "Allocated",
    remarks: `Allocated via transfer. Reason: ${reason}`,
  });

  // Keep asset status as Allocated
  assetDoc.status = "Allocated";
  await assetDoc.save();

  // Audit history
  const actor = actorFrom(req);
  await logHistory(asset, "Transferred", actor, {
    transferId: transfer._id,
    fromEmployee: fromEmployee ? (await User.findById(fromEmployee))?.name : "None",
    toEmployee: toEmployeeDoc.name,
    fromDepartment: fromDepartment ? (await Department.findById(fromDepartment))?.name : "None",
    toDepartment: toDeptDoc.name,
  });

  const populated = await Transfer.findById(transfer._id)
    .populate("asset", "name assetCode category status location")
    .populate("fromEmployee", "name email")
    .populate("toEmployee", "name email")
    .populate("fromDepartment", "name code")
    .populate("toDepartment", "name code")
    .populate("approvedBy", "name email");

  return sendSuccess(res, {
    data: populated,
    message: "Asset transferred successfully and new allocation created",
    statusCode: 201,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Transfer History / Get All Transfers (GET /api/transfers)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTransfers = asyncHandler(async (req, res) => {
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
    sortBy = "transferDate",
    order = "desc",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (asset) {
    assertObjectId(asset, "asset ID filter");
    filter.asset = asset;
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

    // Search employees (can match either from or to employee)
    const users = await User.find({ name: searchRegex }).select("_id");
    employeeIds = users.map((u) => u._id);

    // Search departments (can match either from or to department)
    const depts = await Department.find({ name: searchRegex }).select("_id");
    deptIds = depts.map((d) => d._id);

    filter.$or = [
      { asset: { $in: assetIds } },
      { fromEmployee: { $in: employeeIds } },
      { toEmployee: { $in: employeeIds } },
      { fromDepartment: { $in: deptIds } },
      { toDepartment: { $in: deptIds } },
    ];
  }

  // Filter by department (matches either from or to department)
  if (department) {
    assertObjectId(department, "department ID filter");
    filter.$or = [
      { fromDepartment: department },
      { toDepartment: department }
    ];
  }

  // Filter by employee (matches either from or to employee)
  if (employee) {
    assertObjectId(employee, "employee ID filter");
    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: [{ fromEmployee: employee }, { toEmployee: employee }] }
      ];
      delete filter.$or;
    } else {
      filter.$or = [{ fromEmployee: employee }, { toEmployee: employee }];
    }
  }

  // Filter by category
  if (category) {
    const categoryAssets = await Asset.find({ category }).select("_id");
    const categoryAssetIds = categoryAssets.map((a) => a._id);
    if (filter.$and) {
      filter.$and.push({ asset: { $in: categoryAssetIds } });
    } else if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { asset: { $in: categoryAssetIds } }
      ];
      delete filter.$or;
    } else {
      filter.asset = { $in: categoryAssetIds };
    }
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.transferDate = {};
    if (dateFrom) filter.transferDate.$gte = new Date(dateFrom);
    if (dateTo) filter.transferDate.$lte = new Date(dateTo);
  }

  // Fetch all matching records
  const results = await Transfer.find(filter)
    .populate("asset", "name assetCode category status location")
    .populate("fromEmployee", "name email")
    .populate("toEmployee", "name email")
    .populate("fromDepartment", "name code")
    .populate("toDepartment", "name code")
    .populate("approvedBy", "name email")
    .lean();

  // In-memory sorting (to support nested populated fields like Asset Name, Employee Name, Department)
  const isDesc = order.toLowerCase() === "desc";
  results.sort((a, b) => {
    let fieldA, fieldB;

    if (sortBy === "assetName" || sortBy === "asset") {
      fieldA = a.asset?.name || "";
      fieldB = b.asset?.name || "";
    } else if (sortBy === "employee") {
      fieldA = a.toEmployee?.name || "";
      fieldB = b.toEmployee?.name || "";
    } else if (sortBy === "department") {
      fieldA = a.toDepartment?.name || "";
      fieldB = b.toDepartment?.name || "";
    } else if (sortBy === "transferDate") {
      fieldA = a.transferDate ? new Date(a.transferDate).getTime() : 0;
      fieldB = b.transferDate ? new Date(b.transferDate).getTime() : 0;
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
    message: "Transfers fetched successfully",
    meta: {
      currentPage: pageNum,
      totalPages,
      totalRecords,
      limit: limitNum,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Transfer By ID (GET /api/transfers/:id)
// ─────────────────────────────────────────────────────────────────────────────
export const getTransferById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id, "transfer ID");

  const transfer = await Transfer.findById(id)
    .populate("asset", "name assetCode category status location")
    .populate("fromEmployee", "name email")
    .populate("toEmployee", "name email")
    .populate("fromDepartment", "name code")
    .populate("toDepartment", "name code")
    .populate("approvedBy", "name email")
    .lean();

  if (!transfer) throw new AppError("Transfer record not found", 404);

  return sendSuccess(res, {
    data: transfer,
    message: "Transfer details fetched successfully",
  });
});
