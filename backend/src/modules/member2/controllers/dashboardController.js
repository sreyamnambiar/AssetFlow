import { Allocation } from "../../../models/Allocation.js";
import { Transfer } from "../../../models/Transfer.js";
import { Department } from "../../../models/Department.js";
import { User } from "../../../models/User.js";
import Asset from "../models/Asset.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Basic Counts
  const [
    totalAssets,
    allocatedAssetsCount,
    assignedAssetsCount,
    availableAssets,
    maintenanceAssetsCount,
    underMaintenanceAssetsCount,
    returnedAllocationsCount,
    totalTransfers,
    totalDepartments,
  ] = await Promise.all([
    Asset.countDocuments(),
    Asset.countDocuments({ status: "Allocated" }),
    Asset.countDocuments({ status: "Assigned" }),
    Asset.countDocuments({ status: "Available" }),
    Asset.countDocuments({ status: "Maintenance" }),
    Asset.countDocuments({ status: "under_maintenance" }),
    Allocation.countDocuments({ status: "Returned" }),
    Transfer.countDocuments(),
    Department.countDocuments(),
  ]);

  const totalAllocated = allocatedAssetsCount + assignedAssetsCount;
  const totalMaintenance = maintenanceAssetsCount + underMaintenanceAssetsCount;

  // 2. Chart: Status Breakdown (Pie Chart)
  const statusGroup = await Asset.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const statusBreakdown = statusGroup.map((item) => ({
    status: item._id,
    count: item.count,
  }));

  // 3. Chart: Department Breakdown (Bar Chart of active allocations)
  const deptGroup = await Allocation.aggregate([
    { $match: { status: "Allocated" } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);
  
  // Resolve department names
  const departmentBreakdown = await Promise.all(
    deptGroup.map(async (item) => {
      const dept = item._id ? await Department.findById(item._id).select("name") : null;
      return {
        department: dept ? dept.name : "Unassigned",
        count: item.count,
      };
    })
  );

  // 4. Chart: Allocations Over Time (Last 6 Months - Bar/Line Chart)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const allocationsTrend = await Allocation.aggregate([
    { $match: { allocationDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$allocationDate" },
          month: { $month: "$allocationDate" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Format months for charting
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Fill in missing months to ensure smooth line chart
  const allocationsOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-indexed for MongoDB comparison
    
    const matched = allocationsTrend.find(
      (item) => item._id.year === y && item._id.month === m
    );
    allocationsOverTime.push({
      month: `${monthNames[m - 1]} ${y}`,
      count: matched ? matched.count : 0,
    });
  }

  // 5. Chart: Transfers Over Time (Last 6 Months - Line Chart)
  const transfersTrend = await Transfer.aggregate([
    { $match: { transferDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$transferDate" },
          month: { $month: "$transferDate" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const transfersOverTime = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    
    const matched = transfersTrend.find(
      (item) => item._id.year === y && item._id.month === m
    );
    transfersOverTime.push({
      month: `${monthNames[m - 1]} ${y}`,
      count: matched ? matched.count : 0,
    });
  }

  // 6. Recent Allocations (Top 5)
  const recentAllocations = await Allocation.find()
    .populate("asset", "name assetCode category")
    .populate("employee", "name email")
    .populate("department", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return sendSuccess(res, {
    data: {
      counts: {
        totalAssets,
        allocatedAssets: totalAllocated,
        availableAssets,
        returnedAssets: returnedAllocationsCount,
        maintenanceAssets: totalMaintenance,
        totalTransfers,
        totalDepartments,
      },
      charts: {
        statusBreakdown,
        departmentBreakdown,
        allocationsOverTime,
        transfersOverTime,
      },
      recentAllocations,
    },
    message: "Dashboard statistics fetched successfully",
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ status: "active" }).select("name email role department").populate("department", "name");
  return sendSuccess(res, { data: users, message: "Users fetched successfully" });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const depts = await Department.find().sort({ name: 1 });
  return sendSuccess(res, { data: depts, message: "Departments fetched successfully" });
});
