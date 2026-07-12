import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as notificationService from '../services/notificationService.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id, req.query);
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markNotificationAsRead(req.params.id, req.user._id);
  sendSuccess(res, { data, message: 'Notification marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user._id);
  sendSuccess(res, { message: 'All notifications marked as read' });
});

export const removeNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Notification deleted' });
});
