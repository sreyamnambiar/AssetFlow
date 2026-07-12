import http from './http.js';

export async function fetchAssets(params = {}) {
  const response = await http.get('/assets', { params });
  return response.data.data;
}