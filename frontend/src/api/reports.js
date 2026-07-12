import http from './http.js';

export async function fetchUtilization() {
  const response = await http.get('/reports/utilization');
  return response.data.data;
}

export async function fetchIdleAssets() {
  const response = await http.get('/reports/idle-assets');
  return response.data.data;
}

export async function fetchMaintenanceReport() {
  const response = await http.get('/reports/maintenance');
  return response.data.data;
}

export async function fetchDepartmentSummary() {
  const response = await http.get('/reports/department-summary');
  return response.data.data;
}

export async function fetchHeatmap() {
  const response = await http.get('/reports/heatmap');
  return response.data.data;
}

export async function fetchRetirement() {
  const response = await http.get('/reports/retirement');
  return response.data.data;
}

export async function fetchMostUsed() {
  const response = await http.get('/reports/most-used');
  return response.data.data;
}
