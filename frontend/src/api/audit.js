import http from './http.js';

export async function fetchAuditCycles(params = {}) {
  const response = await http.get('/audit/cycles', { params });
  return response.data;
}

export async function fetchAuditCycleById(id) {
  const response = await http.get(`/audit/${id}`);
  return response.data.data;
}

export async function createAuditCycle(payload) {
  const response = await http.post('/audit/cycle', payload);
  return response.data.data;
}

export async function fetchAuditors() {
  const response = await http.get('/audit/auditors');
  return response.data.data;
}
