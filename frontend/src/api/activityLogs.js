import http from './http.js';

export async function fetchActivityLogs(params = {}) {
  const response = await http.get('/activity-logs/filter', { params });
  return response.data;
}
