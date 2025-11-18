export interface Building {
  id: number;
  name: string;
}

export interface Floor {
  id: number;
  name: string;
  building_id: number;
}

export interface Space {
  id: number;
  name: string;
  floor_id: number;
  capacity: number;
  building: number;
  floor_name: string;
}

export interface Reservation {
  id: number;
  space: number;
  space_name: string;
  building_name: string;
  floor_name: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  status: 'pending' | 'confirmado' | 'canceled' | 'completed';
  user_email: string;
  capacity: number;
  is_recurring?: boolean;
  recurring_days?: string;
  recurring_start_date?: string;
  recurring_end_date?: string;
  recurring_horarios?: string | Record<string, { inicio: string; fim: string }>;
}

export interface ReservationData {
  space: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  status?: string;
  is_recurring?: boolean;
  recurring_days?: string[];
  recurring_start_date?: string;
  recurring_end_date?: string;
  recurring_horarios?: Record<string, { inicio: string; fim: string }>;
  phone: string;
  course: string;
}

export interface StepContent {
  campus: {
    label: string;
    placeholder: string;
    options: string[];
  };
  andar: {
    label: string;
    placeholder: string;
    options: string[];
  };
  sala: {
    label: string;
    placeholder: string;
    options: string[];
  };
}