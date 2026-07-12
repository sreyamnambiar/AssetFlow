import http from './http.js';

export async function createAllocation(data) {
  const response = await http.post('/allocations', data);
  return response.data;
}

export async function fetchAllocations(params = {}) {
  const response = await http.get('/allocations', { params });
  return response.data;
}

export async function fetchAllocationById(id) {
  const response = await http.get(`/allocations/${id}`);
  return response.data.data;
}

export async function updateAllocation(id, data) {
  const response = await http.put(`/allocations/${id}`, data);
  return response.data;
}

export async function returnAllocation(id, remarks) {
  const response = await http.put(`/allocations/${id}/return`, { remarks });
  return response.data;
}

export async function deleteAllocation(id) {
  const response = await http.delete(`/allocations/${id}`);
  return response.data;
}
