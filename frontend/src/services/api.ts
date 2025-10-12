import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

export const getUserReservations = async () => {
  const response = await api.get('/reservations/');
  return response.data;
};

export const createReservation = async (reservationData: any) => {
  const response = await api.post('/reservations/', reservationData);
  return response.data;
};

export default api;