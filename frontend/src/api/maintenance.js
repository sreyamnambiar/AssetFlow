import http from './http.js';

function buildFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key === 'imageFile') return;
    formData.append(key, value);
  });

  if (payload.imageFile) {
    formData.append('image', payload.imageFile);
  }

  return formData;
}

export async function fetchMaintenanceRequests(params = {}) {
  const response = await http.get('/maintenance', { params });
  return response.data;
}

export async function fetchMaintenanceById(id) {
  const response = await http.get(`/maintenance/${id}`);
  return response.data.data;
}

export async function createMaintenanceRequest(payload) {
  const response = await http.post('/maintenance', buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function updateMaintenanceRequest(id, payload) {
  const response = await http.put(`/maintenance/${id}`, buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function deleteMaintenanceRequest(id) {
  const response = await http.delete(`/maintenance/${id}`);
  return response.data.data;
}

export async function fetchTechnicians() {
  const response = await http.get('/users/technicians');
  return response.data.data;
}