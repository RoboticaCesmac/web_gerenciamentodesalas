import axios from 'axios';
import type { ReservationData } from '../types';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Authentication
export const login = async (username: string, password: string) => {
    try {
        console.log('Login attempt:', { username });
        
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        
        const response = await api.post('/api/auth/login/', {
            username: username.trim(),
            password: password
        });
        
        if (response.data && response.data.token) {
            const token = response.data.token;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Token ${token}`;
            return response.data;
        }
        
        throw new Error('Token não recebido do servidor');
    } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.detail || 'Erro de autenticação');
    }
};

// Auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// API endpoints
export const getUserProfile = async () => {
    const response = await api.get('/api/users/profile/');
    return response.data;
};

export const getBuildings = async () => {
    const response = await api.get('/api/buildings/');
    return response.data;
};

export const getFloors = async (buildingId: number) => {
    const response = await api.get(`/api/buildings/${buildingId}/floors/`);
    return response.data;
};

export const getSpaces = async (buildingId: number, floorId: number) => {
    if (!buildingId || !floorId || isNaN(buildingId) || isNaN(floorId)) {
        throw new Error('Building ID and Floor ID are required');
    }
    
    const response = await api.get('/api/spaces/', {
        params: { 
            building: buildingId.toString(),
            floor: floorId.toString()
        }
    });
    return response.data;
};

// export interface ReservationData {
//   space: number;
//   date?: string;
//   start_time?: string;
//   end_time?: string;
//   description: string;
//   status?: string;
//   is_recurring?: boolean;
//   recurring_days?: string[];
//   recurring_start_date?: string;
//   recurring_end_date?: string;
//   recurring_horarios?: {
//     [key: string]: { inicio: string; fim: string };
//   };
//   phone?: string; // ADICIONE ESTE CAMPO
//   course?: string; // ADICIONE ESTE CAMPO
// }

export const createReservation = async (data: ReservationData) => {
  try {
    console.log('Creating reservation with data:', data);
    
    // Preparar dados para enviar
    const reservationPayload: any = {
      space: data.space,
      description: data.description || '',
      status: 'pending',
      is_recurring: data.is_recurring || false,
      phone: data.phone || '', // ADICIONE ESTE CAMPO
      course: data.course || '' // ADICIONE ESTE CAMPO
    };

    if (data.is_recurring) {
      // Para reservas recorrentes
      reservationPayload.recurring_days = (data.recurring_days || []).join(',');
      reservationPayload.recurring_start_date = data.recurring_start_date;
      reservationPayload.recurring_end_date = data.recurring_end_date;
      reservationPayload.recurring_times = {};
      
      // Mapear os horários para cada dia
      const dayMap: { [key: string]: [string, string] } = {
        'seg': ['monday_start', 'monday_end'],
        'ter': ['tuesday_start', 'tuesday_end'],
        'qua': ['wednesday_start', 'wednesday_end'],
        'qui': ['thursday_start', 'thursday_end'],
        'sex': ['friday_start', 'friday_end'],
        'sab': ['saturday_start', 'saturday_end'],
        'dom': ['sunday_start', 'sunday_end']
      };

      (data.recurring_days || []).forEach(day => {
        const horarios = data.recurring_horarios?.[day];
        if (horarios && dayMap[day]) {
          const [startField, endField] = dayMap[day];
          reservationPayload[startField] = horarios.inicio;
          reservationPayload[endField] = horarios.fim;
          
          reservationPayload.recurring_times[day] = {
            start: horarios.inicio,
            end: horarios.fim
          };
        }
      });

      // Data e hora são obrigatórios no modelo, usar o primeiro dia
      reservationPayload.date = data.recurring_start_date;
      reservationPayload.start_time = data.recurring_horarios?.['seg']?.inicio || '09:00';
      reservationPayload.end_time = data.recurring_horarios?.['seg']?.fim || '10:00';
    } else {
      // Para reservas únicas
      reservationPayload.date = data.date;
      reservationPayload.start_time = data.start_time;
      reservationPayload.end_time = data.end_time;
    }

    console.log('Payload being sent:', reservationPayload);

    const response = await api.post('/api/reservations/', reservationPayload);
    console.log('Reservation created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Reservation creation error:', error.response);
    throw new Error(error.response?.data?.detail || 'Erro ao criar reserva');
  }
};

export const getUserReservations = async () => {
    try {
        const response = await api.get('/api/reservations/');
        console.log('Received reservations:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching reservations:', error);
        throw error;
    }
};

export const checkAvailability = async (spaceId: number, date: string) => {
    const response = await api.get(`/api/spaces/${spaceId}/availability/`, {
        params: { date }
    });
    return response.data;
};

export const cancelReservation = async (reservationId: number) => {
    try {
        console.log(`Sending PATCH request to /api/reservations/${reservationId}/`);
        console.log('Payload: { status: "canceled" }');
        
        const response = await api.patch(`/api/reservations/${reservationId}/`, {
            status: 'canceled'
        });
        
        console.log('Cancel response status:', response.status);
        console.log('Cancel response data:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Cancel error status:', error.response?.status);
        console.error('Cancel error data:', error.response?.data);
        throw error;
    }
};

export { api };