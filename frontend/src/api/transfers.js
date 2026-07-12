import http from './http.js';

export async function createTransfer(data) {
  const response = await http.post('/transfers', data);
  return response.data;
}

export async function fetchTransfers(params = {}) {
  const response = await http.get('/transfers', { params });
  return response.data;
}

export async function fetchTransferById(id) {
  const response = await http.get(`/transfers/${id}`);
  return response.data.data;
}
