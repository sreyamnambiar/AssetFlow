import { Notification } from '../models/Notification.js';

export async function getUserNotifications(userId, query = {}) {
  const filter = { user_id: userId };
  if (query.type) filter.type = query.type;
  if (query.is_read !== undefined) filter.is_read = query.is_read === 'true';

  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markNotificationAsRead(id, userId) {
  const notif = await Notification.findOneAndUpdate(
    { _id: id, user_id: userId },
    { is_read: true },
    { new: true }
  );
  if (!notif) throw new Error('Notification not found or unauthorized');
  return notif;
}

export async function markAllNotificationsAsRead(userId) {
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true }
  );
  return { success: true };
}

export async function deleteNotification(id, userId) {
  const notif = await Notification.findOneAndDelete({ _id: id, user_id: userId });
  if (!notif) throw new Error('Notification not found or unauthorized');
  return { success: true };
}
