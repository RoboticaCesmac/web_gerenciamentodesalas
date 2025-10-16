import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://sgs-cesmac.netlify.app/api'
    : 'http://localhost:5173/api',
  withCredentials: true
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
  try {
    const response = await api.post('/auth/login/', credentials);
    
    if (response.status === 200 && response.data.token) {
      // Configurar o token
      localStorage.setItem('token', response.data.token);
      
      // Configurar o token no axios
      api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
      
      // Salvar dados do usuário
      if (response.data.user) {
        localStorage.setItem('userProfile', JSON.stringify(response.data.user));
      }
      
      return { ok: true, token: response.data.token };
    }
    
    return { ok: false, error: 'Credenciais inválidas' };
  } catch (error) {
    console.error('Erro no login:', error);
    return { ok: false, error: 'Erro ao fazer login' };
  }
};

export const getUserProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

export const getUserReservations = async () => {
  try {
    const response = await api.get('reservations/');
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

    const response = await api.post('/reservations/', data, {
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

export const updateReservation = async (id: number, data: any) => {
  const response = await fetch(`reservations/${id}`, {
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
    const response = await api.patch(`/reservations/${reservationId}/`, {
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

// Export the api instance
export { api };