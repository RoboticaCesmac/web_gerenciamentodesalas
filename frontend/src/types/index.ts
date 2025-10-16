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
  capacity: number;
  building: number;
  floor_name: string;
  floor_id: number;
}

export interface Reservation {
  id: number;
  title: string;
  description: string;
  space: number;
  space_name: string;
  building: number;
  building_name: string;
  floor_name: string;
  start_datetime: string;
  end_datetime: string;
  status: 'confirmado' | 'pending' | 'rejected' | 'completed' | 'canceled';
  user_email: string;
  capacity: number;
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