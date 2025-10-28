import type { Space, Reservation, StepContent } from '../types';

export const dummyUsers = [
  { username: "wagener.araujo", password: "senhasgs" },
  { username: "mozart.melo", password: "senhasgs" },
  { username: "carlos.filho", password: "senhasgs" },
  { username: "enzo.machado", password: "senhasgs" },
  { username: "sergio.venancio", password: "senhasgs" }
];

export const dummyBuildings = [
  { id: 1, name: "Campus 1" },
  { id: 2, name: "Campus 2" },
  { id: 3, name: "Campus 3" },
  { id: 4, name: "Campus 4" }
];

export const dummyFloors = [
  { id: 1, name: "Andar 1", building_id: 1 },
  { id: 2, name: "Andar 2", building_id: 1 },
  { id: 3, name: "Andar 3", building_id: 1 },
  { id: 1, name: "Andar 1", building_id: 2 },
  { id: 2, name: "Andar 2", building_id: 2 },
  { id: 3, name: "Andar 3", building_id: 2 },
  { id: 1, name: "Andar 1", building_id: 3 },
  { id: 2, name: "Andar 2", building_id: 3 },
  { id: 3, name: "Andar 3", building_id: 3 },
  { id: 1, name: "Andar 1", building_id: 4 },
  { id: 2, name: "Andar 2", building_id: 4 },
  { id: 3, name: "Andar 3", building_id: 4 },
];

export const dummyRooms: Space[] = [
  { 
    id: 1, 
    name: "Sala 101", 
    floor_id: 1, 
    capacity: 30,
    building: 1,
    floor_name: "Andar 1"
  },
  { 
    id: 2, 
    name: "Lab 01", 
    floor_id: 1, 
    capacity: 25,
    building: 1,
    floor_name: "Andar 1"
  },
  { 
    id: 3, 
    name: "Lab 02", 
    floor_id: 2, 
    capacity: 25,
    building: 2,
    floor_name: "Andar 2"
  },
  { 
    id: 4, 
    name: "Lab 03", 
    floor_id: 2, 
    capacity: 25,
    building: 2,
    floor_name: "Andar 2"
  },
  { 
    id: 5, 
    name: "Sala 202", 
    floor_id: 1, 
    capacity: 30,
    building: 2,
    floor_name: "Andar 2"
  },
  { 
    id: 6, 
    name: "Sala 303", 
    floor_id: 2, 
    capacity: 30,
    building: 2,
    floor_name: "Andar 3"
  },
  { 
    id: 7, 
    name: "Auditório 1", 
    floor_id: 3, 
    capacity: 100,
    building: 1,
    floor_name: "Andar 3"
  },
  { 
    id: 8, 
    name: "Auditório 2", 
    floor_id: 3, 
    capacity: 100,
    building: 2,
    floor_name: "Andar 3"
  },
  { 
    id: 9, 
    name: "Auditório 3", 
    floor_id: 3, 
    capacity: 100,
    building: 3,
    floor_name: "Andar 3"
  }
];

// Update reservation status to match the union type
export const dummyReservations: Reservation[] = [
  {
    id: 1,
    title: "Aula de Programação",
    description: "Aula prática de desenvolvimento web",
    space: 1,
    space_name: "Sala 101",
    building: 1,
    building_name: "Campus 1",
    floor_name: "Andar 1",
    start_datetime: "2025-10-17T08:00:00",
    end_datetime: "2025-10-17T10:00:00",
    status: "confirmado",
    user_email: "wagener.araujo@cesmac.edu.br",
    capacity: 30
  },
  {
    id: 2,
    title: "Reunião de Projeto",
    description: "Discussão sobre o andamento do projeto",
    space: 2,
    space_name: "Sala 101",
    building: 1,
    building_name: "Campus 1",
    floor_name: "Andar 1",
    start_datetime: "2025-10-17T10:00:00",
    end_datetime: "2025-10-17T12:00:00",
    status: "canceled", 
    user_email: "mozart.melo@cesmac.edu.br",
    capacity: 30
  },
  {
    id: 3,
    title: "Aula de Matemática",
    description: "Aula teórica de cálculo avançado",
    space: 7,
    space_name: "Auditório 1",
    building: 1,
    building_name: "Campus 1",
    floor_name: "Andar 3",
    start_datetime: "2025-10-17T13:00:00",
    end_datetime: "2025-10-17T15:00:00",
    status: "completed", // Changed to completed
    user_email: "carlos.filho@cesmac.edu.br",
    capacity: 100
  },
  {
    id: 4,
    title: "Laboratório de Química",
    description: "Experimentos práticos de química orgânica",
    space: 3,
    space_name: "Lab 02",
    building: 2,
    building_name: "Campus 2",
    floor_name: "Andar 2",
    start_datetime: "2025-10-18T08:00:00",
    end_datetime: "2025-10-18T10:00:00",
    status: "pending",
    user_email: "enzo.machado@cesmac.edu.br",
    capacity: 25
  },
  {
    id: 5,
    title: "Seminário de Física",
    description: "Discussão sobre os princípios da física quântica",
    space: 8,
    space_name: "Auditório 2",
    building: 2,
    building_name: "Campus 2",
    floor_name: "Andar 3",
    start_datetime: "2025-10-18T10:00:00",
    end_datetime: "2025-10-18T12:00:00",
    status: "canceled",
    user_email: "wagener.araujo@cesmac.edu.br",
    capacity: 100
  },
  {
    id: 6,
    title: "Reunião de Pais",
    description: "Encontro com os pais dos alunos",
    space: 5,
    space_name: "Sala 202",
    building: 2,
    building_name: "Campus 2",
    floor_name: "Andar 2",
    start_datetime: "2025-10-18T13:00:00",
    end_datetime: "2025-10-18T15:00:00",
    status: "confirmado",
    user_email: "mozart.melo@cesmac.edu.br",
    capacity: 30
  },
  {
    id: 7,
    title: "Aula de História",
    description: "Aula expositiva sobre a Idade Média",
    space: 9,
    space_name: "Auditório 3",
    building: 2,
    building_name: "Campus 2",
    floor_name: "Andar 3",
    start_datetime: "2025-10-18T08:00:00",
    end_datetime: "2025-10-18T10:00:00",
    status: "completed",
    user_email: "carlos.filho@cesmac.edu.br",
    capacity: 100
  },
  {
    id: 8,
    title: "Oficina de Artes",
    description: "Atividade prática de pintura e desenho",
    space: 6,
    space_name: "Sala 303",
    building: 2,
    building_name: "Campus 2",
    floor_name: "Andar 3",
    start_datetime: "2025-10-18T10:00:00",
    end_datetime: "2025-10-18T12:00:00",
    status: "pending",
    user_email: "enzo.machado@cesmac.edu.br",
    capacity: 30
  },
  {
    id: 9,
    title: "Palestra sobre Sustentabilidade",
    description: "Palestra sobre práticas sustentáveis",
    space: 7,
    space_name: "Auditório 1",
    building: 3,
    building_name: "Campus 3",
    floor_name: "Andar 3",
    start_datetime: "2025-10-19T08:00:00",
    end_datetime: "2025-10-19T10:00:00",
    status: "completed",
    user_email: "wagener.araujo@cesmac.edu.br",
    capacity: 100
  },
  {
    id: 10,
    title: "Aula de Biologia",
    description: "Aula prática de laboratório de biologia",
    space: 4,
    space_name: "Lab 03",
    building: 3,
    building_name: "Campus 3",
    floor_name: "Andar 2",
    start_datetime: "2025-10-19T10:00:00",
    end_datetime: "2025-10-19T12:00:00",
    status: "confirmado",
    user_email: "mozart.melo@cesmac.edu.br",
    capacity: 25
  }
];

export const stepContentsDynamic: StepContent = {
  campus: {
    label: "Selecione o Campus",
    placeholder: "Escolher Campus",
    options: ["Campus 1", "Campus 2", "Campus 3", "Campus 4"]
  },
  andar: {
    label: "Selecione o Andar",
    placeholder: "Escolher Andar",
    options: ["Andar 1", "Andar 2", "Andar 3"]
  },
  sala: {
    label: "Selecione a Sala",
    placeholder: "Escolher Sala",
    options: ["Sala 101", "Lab 01", "Lab 02", "Lab 03", "Sala 202", "Sala 303", "Auditório 1", "Auditório 2", "Auditório 3"]
  }
};

export const getFloorsByBuilding = (buildingId: number) => {
  return dummyFloors.filter(floor => floor.building_id === buildingId);
};

export const getRoomsByFloor = (floorId: number) => {
  return dummyRooms.filter(room => room.floor_id === floorId);
};