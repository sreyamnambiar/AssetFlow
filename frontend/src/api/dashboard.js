import http from './http.js';

export async function fetchDashboardStats() {
  const response = await http.get('/dashboard/stats');
  return response.data.data;
}

export async function fetchUsers() {
  const response = await http.get('/dashboard/users');
  return response.data.data;
}

export async function fetchDepartments() {
  const response = await http.get('/dashboard/departments');
  return response.data.data;
}
