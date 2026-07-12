import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { Asset } from '../models/Asset.js';
import { Booking } from '../models/Booking.js';
import { Maintenance } from '../models/Maintenance.js';

/* ── GET /reports/utilization ─────────────────────────────────
   Returns asset count grouped by status + category breakdown   */
export const getUtilization = asyncHandler(async (_req, res) => {
  const assets = await Asset.find().lean();

  // Group by category
  const byCategory = {};
  for (const a of assets) {
    const cat = a.category || 'Uncategorised';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, in_use: 0, available: 0, under_maintenance: 0, unavailable: 0 };
    byCategory[cat].total += 1;
    byCategory[cat][a.status] = (byCategory[cat][a.status] || 0) + 1;
  }

  // Utilization % per category (in_use / total * 100)
  const categories = Object.entries(byCategory).map(([name, counts]) => ({
    name,
    total:       counts.total,
    in_use:      counts.in_use      || 0,
    available:   counts.available   || 0,
    maintenance: counts.under_maintenance || 0,
    utilization: counts.total ? Math.round((counts.in_use / counts.total) * 100) : 0,
  }));

  // Overall summary
  const statusSummary = assets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  sendSuccess(res, { data: { categories, statusSummary, totalAssets: assets.length } });
});

/* ── GET /reports/idle-assets ─────────────────────────────────
   Assets that have 'available' status (never recently booked) */
export const getIdleAssets = asyncHandler(async (_req, res) => {
  const assets = await Asset.find({ status: 'available' }).lean();

  // For each available asset, check when last booked
  const bookings = await Booking.find({ status: { $in: ['completed', 'cancelled'] } })
    .sort({ updatedAt: -1 })
    .lean();

  const lastBookedMap = {};
  for (const b of bookings) {
    const key = String(b.assetId);
    if (!lastBookedMap[key]) lastBookedMap[key] = b.bookingDate;
  }

  const now = new Date();
  const idleAssets = assets.map((a) => {
    const lastBookedDate = lastBookedMap[String(a._id)];
    const idleDays = lastBookedDate
      ? Math.floor((now - new Date(lastBookedDate)) / 86400000)
      : null; // never booked
    return {
      _id:          a._id,
      assetCode:    a.assetCode,
      name:         a.name,
      category:     a.category,
      location:     a.location,
      lastBookedDate,
      idleDays,
    };
  });

  // Sort: never-booked first, then longest idle
  idleAssets.sort((a, b) => {
    if (a.idleDays === null && b.idleDays === null) return 0;
    if (a.idleDays === null) return -1;
    if (b.idleDays === null) return 1;
    return b.idleDays - a.idleDays;
  });

  sendSuccess(res, { data: idleAssets });
});

/* ── GET /reports/maintenance ─────────────────────────────────
   Monthly maintenance counts for the last 6 months            */
export const getMaintenanceReport = asyncHandler(async (_req, res) => {
  const requests = await Maintenance.find().sort({ createdAt: 1 }).lean();

  const now = new Date();
  // Build 6-month buckets
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label:  d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      year:   d.getFullYear(),
      month:  d.getMonth(),
      count:  0,
      resolved: 0,
    });
  }

  for (const r of requests) {
    const d = new Date(r.createdAt);
    const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (bucket) {
      bucket.count += 1;
      if (r.status === 'Resolved') bucket.resolved += 1;
    }
  }

  // Most maintained assets
  const assetCount = {};
  for (const r of requests) {
    const key = String(r.assetId);
    assetCount[key] = (assetCount[key] || 0) + 1;
  }

  const topAssets = await Promise.all(
    Object.entries(assetCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(async ([id, count]) => {
        const asset = await Asset.findById(id).lean().catch(() => null);
        return {
          assetId:   id,
          assetCode: asset?.assetCode,
          name:      asset?.name || 'Unknown',
          count,
        };
      })
  );

  sendSuccess(res, { data: { monthly: months, topAssets, totalRequests: requests.length } });
});

/* ── GET /reports/department-summary ─────────────────────────
   Assets allocated per department (derived from audit cycles) */
export const getDepartmentSummary = asyncHandler(async (_req, res) => {
  const { AuditCycle, AuditRecord } = await import('../models/Audit.js');

  const cycles = await AuditCycle.find().lean();
  const summary = {};

  for (const cycle of cycles) {
    const dept = cycle.department || 'Unknown';
    if (!summary[dept]) summary[dept] = { department: dept, assetCount: 0, activeCycles: 0, closedCycles: 0 };
    if (cycle.status === 'active') summary[dept].activeCycles += 1;
    else summary[dept].closedCycles += 1;

    const recordCount = await AuditRecord.countDocuments({ auditCycleId: cycle._id });
    summary[dept].assetCount += recordCount;
  }

  // Pad with asset model data if no audit cycles exist
  if (Object.keys(summary).length === 0) {
    const assets = await Asset.find().lean();
    for (const a of assets) {
      const cat = a.category || 'General';
      if (!summary[cat]) summary[cat] = { department: cat, assetCount: 0, activeCycles: 0, closedCycles: 0 };
      summary[cat].assetCount += 1;
    }
  }

  sendSuccess(res, { data: Object.values(summary) });
});

/* ── GET /reports/heatmap ──────────────────────────────────────
   Booking frequency per day-of-week × hour (last 30 days)     */
export const getHeatmap = asyncHandler(async (_req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookings = await Booking.find({
    createdAt: { $gte: thirtyDaysAgo },
  }).lean();

  // 7 days × 24 hours grid initialised to 0
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const b of bookings) {
    const day  = new Date(b.bookingDate).getDay(); // 0=Sun
    const hour = parseInt((b.startTime || '00:00').split(':')[0], 10);
    if (!isNaN(day) && !isNaN(hour)) {
      grid[day][hour] += 1;
    }
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  sendSuccess(res, {
    data: {
      grid,
      days,
      hours: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
      totalBookings: bookings.length,
    },
  });
});

/* ── GET /reports/retirement ───────────────────────────────────
   Assets > 3 years old (nearing retirement) + due maintenance */
export const getRetirement = asyncHandler(async (_req, res) => {
  const assets = await Asset.find().lean();
  const maintenanceList = await Maintenance.find({
    status: { $in: ['Pending', 'Approved'] },
  })
    .populate('assetId', 'name assetCode category location')
    .sort({ createdAt: 1 })
    .lean();

  const now = new Date();
  const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

  const nearRetirement = assets
    .filter((a) => now - new Date(a.createdAt) >= THREE_YEARS_MS)
    .map((a) => ({
      _id:       a._id,
      assetCode: a.assetCode,
      name:      a.name,
      category:  a.category,
      location:  a.location,
      ageYears:  Math.floor((now - new Date(a.createdAt)) / (365 * 24 * 60 * 60 * 1000)),
    }))
    .sort((a, b) => b.ageYears - a.ageYears);

  const dueMaintenance = maintenanceList.slice(0, 10).map((m) => ({
    _id:              m._id,
    assetCode:        m.assetId?.assetCode,
    assetName:        m.assetId?.name || 'Unknown',
    priority:         m.priority,
    status:           m.status,
    issueDescription: m.issueDescription,
    daysPending:      Math.floor((now - new Date(m.createdAt)) / 86400000),
  }));

  sendSuccess(res, { data: { nearRetirement, dueMaintenance } });
});

/* ── GET /reports/most-used ────────────────────────────────────
   Assets sorted by total completed booking count              */
export const getMostUsed = asyncHandler(async (_req, res) => {
  const bookings = await Booking.find().lean();

  const assetCount = {};
  for (const b of bookings) {
    const key = String(b.assetId);
    assetCount[key] = (assetCount[key] || 0) + 1;
  }

  const topEntries = Object.entries(assetCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topAssets = await Promise.all(
    topEntries.map(async ([id, count]) => {
      const asset = await Asset.findById(id).lean().catch(() => null);
      return {
        assetId:   id,
        assetCode: asset?.assetCode,
        name:      asset?.name || 'Unknown',
        category:  asset?.category,
        location:  asset?.location,
        bookingCount: count,
      };
    })
  );

  sendSuccess(res, { data: topAssets });
});
