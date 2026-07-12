import http from './http.js';

export async function fetchBookableAssets(params = {}) {
  const response = await http.get('/bookings/resources', { params });
  return response.data.data;
}

export async function fetchBookings(params = {}) {
  const response = await http.get('/bookings', { params });
  return response.data;
}

export async function fetchBookingById(id) {
  const response = await http.get(`/bookings/${id}`);
  return response.data.data;
}

export async function createBooking(payload) {
  const response = await http.post('/bookings', payload);
  return response.data.data;
}

export async function updateBooking(id, payload) {
  const response = await http.put(`/bookings/${id}`, payload);
  return response.data.data;
}

export async function cancelBooking(id) {
  const response = await http.delete(`/bookings/${id}`);
  return response.data.data;
}