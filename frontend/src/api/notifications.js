import http from './http.js';

export async function fetchNotifications(params = {}) {
  const response = await http.get('/notifications', { params });
  return response.data;
}

export async function markAsRead(id) {
  const response = await http.put(`/notifications/read/${id}`);
  return response.data.data;
}

export async function markAllAsRead() {
  const response = await http.put('/notifications/read-all');
  return response.data;
}

export async function deleteNotification(id) {
  const response = await http.delete(`/notifications/${id}`);
  return response.data;
}
