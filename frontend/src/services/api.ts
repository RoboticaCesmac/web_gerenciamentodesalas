import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`; // Changed from Bearer to Token
  }
  return config;
});

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/auth/login/', credentials);
  const { token } = response.data;
  
  // Save token
  localStorage.setItem('token', token);
  
  // Save user data
  if (response.data.user) {
    localStorage.setItem('userProfile', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

export const getUserReservations = async () => {
  try {
    const response = await api.get('/reservations/');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    throw error;
  }
};

export const createReservation = async (reservationData: any) => {
  const response = await api.post('/reservations/', reservationData);
  return response.data;
};

export const getBuildings = async () => {
  const response = await api.get('/buildings/');
  return response.data;
};

export const getFloorsByBuilding = async (buildingId: number) => {
  const response = await api.get(`/buildings/${buildingId}/floors/`);
  return response.data;
};

export const getSpacesByFloor = async (floorId: number) => {
  const response = await api.get(`/floors/${floorId}/spaces/`);
  return response.data;
};