import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as activityLogService from '../services/activityLogService.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await activityLogService.getLogs(req.query);
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
});
