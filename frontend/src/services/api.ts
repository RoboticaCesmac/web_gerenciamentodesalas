import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/api/auth/login/', credentials);
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
  const response = await api.get('/api/auth/profile/');
  return response.data;
};

export const getUserReservations = async () => {
  try {
    const response = await api.get('api/reservations/');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    throw error;
  }
};

export const createReservation = async (data: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await api.post('/api/reservations/', data, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return { ok: true, data: response.data };
  } catch (error: any) {
    console.error('Erro ao criar reserva:', error.response?.data || error.message);
    return { 
      ok: false, 
      error: error.response?.data?.detail || 'Erro ao criar reserva'
    };
  }
};

export const getBuildings = async () => {
  const response = await api.get('/api/buildings/');
  return response.data;
};

export const getFloorsByBuilding = async (buildingId: number) => {
  const response = await api.get(`/api/buildings/${buildingId}/floors/`);
  return response.data;
};

export const getSpacesByFloor = async (floorId: number) => {
  const response = await api.get(`/api/floors/${floorId}/spaces/`);
  return response.data;
};

export const updateReservation = async (id: number, data: any) => {
  const response = await fetch(`api/reservations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update reservation');
  }
  
  return response.json();
};

export const cancelReservation = async (reservationId: number) => {
  try {
    const response = await api.patch(`/api/reservations/${reservationId}/`, {
      status: 'canceled'
    });
    
    if (response.status === 200) {
      return { ok: true, data: response.data };
    } else {
      console.error('Erro na resposta:', response);
      return { ok: false, error: 'Erro ao cancelar reserva' };
    }
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    return { ok: false, error: 'Erro ao cancelar reserva' };
  }
};