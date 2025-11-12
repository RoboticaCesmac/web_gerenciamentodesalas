import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Agendamento.css';
import logoImg from '../../assets/logo-CESMAC-redux.svg';
import Campusico from '../../assets/Campus-ico.svg';
import userImg from '../../assets/Icones-Perfil.svg';
import PingIcon from '../../assets/ping.svg';
import PlusIcon from '../../assets/Plus.svg';
import RightArrowIcon from '../../assets/Right-Arrow.svg';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import LogoutIcon from '../../assets/Sair.svg';
import Relogio from '../../assets/Relogio.svg';
import Calendario from '../../assets/Calendario.svg';
import ChapeuIcon from '../../assets/chapeu.svg';
import TelefoneIcon from '../../assets/telefone.svg';
import MensagemIcon from '../../assets/Icones-Mensagem.svg';
import CheckIcon from '../../assets/check.svg';
import BigCheckIcon from '../../assets/Big-Check.svg';
import { 
    api,
    getUserProfile,
    getUserReservations,
    createReservation,
    cancelReservation,
    getBuildings,
    getFloors,
    getSpaces,
    checkAvailability
} from '../../services/api';
import type { 
    Space, 
    Reservation, 
    ReservationData 
} from '../../types';
import { 
  dummyBuildings, 
  dummyFloors, 
  dummyRooms, 
  dummyReservations,
  stepContentsDynamic 
} from '../../services/dummyData';

interface TimeRange {
  start: string;
  end: string;
}

interface SelectedDate {
  date: Date | null;
  isAvailable: boolean;
}

interface UnavailableTime {
  date: string;
  times: string[];
}

interface DayStatus {
  date: string;
  status: 'disponivel' | 'ocupado' | 'selecionado';
}

type AgendamentoStep = 'campus' | 'andar' | 'sala' | 'confirmacao' | 'resumo' | 'sucesso';

interface BookingDetails {
  campus: string;
  andar: string;
  sala: string;
  data: string;
  horario: {
    inicio: string;
    fim: string;
  };
  curso: string;
  telefone: string;
  observacao: string;
  isRecurring: boolean;
  recurringDays: string[];
  recurringStartDate: string;
  recurringEndDate: string;
  // Novo: horários para cada dia da semana
  recurringHorarios: {
    [key: string]: { inicio: string; fim: string };
  };
}

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
}

export const Agendamento: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [historico, setHistorico] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false);
  const [mostrarTodosAgendamentos, setMostrarTodosAgendamentos] = useState(false);
  const [mostrarTodoHistorico, setMostrarTodoHistorico] = useState(false);
  const [agendamentoStep, setAgendamentoStep] = useState<AgendamentoStep>('campus');
  const [selectedValues, setSelectedValues] = useState({
    campus: '',
    andar: '',
    sala: ''
  });
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: '', end: '' });
  const [selectedDate, setSelectedDate] = useState<SelectedDate>({
    date: null,
    isAvailable: true
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    campus: '',
    andar: '',
    sala: '',
    data: '',
    horario: { inicio: '', fim: '' },
    curso: '',
    telefone: '',
    observacao: '',
    isRecurring: false,
    recurringDays: [],
    recurringStartDate: '',
    recurringEndDate: '',
    recurringHorarios: {
      seg: { inicio: '', fim: '' },
      ter: { inicio: '', fim: '' },
      qua: { inicio: '', fim: '' },
      qui: { inicio: '', fim: '' },
      sex: { inicio: '', fim: '' },
      sab: { inicio: '', fim: '' },
      dom: { inicio: '', fim: '' }
    }
  });
  const [isEditing, setIsEditing] = useState(false);

  // Novos estados para disponibilidade
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const novoAgendamentoRef = useRef<HTMLDivElement>(null);

  // Estados para confirmação de cancelamento
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(null);

  // Adicione o estado para selectedSpace
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  // Função para validar a entrada do telefone
  const validatePhoneInput = (value: string): string => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica a máscara (xx) x xxxx-xxxx
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        const storedProfile = localStorage.getItem('userProfile');
        if (!storedProfile) {
          navigate('/login');
          return;
        }
        setUserProfile(JSON.parse(storedProfile));

        // Load buildings
        const buildingsData = await getBuildings();
        setBuildings(buildingsData);

        // Load user's reservations
        const reservationsData = await getUserReservations();
        const activeReservations = reservationsData.filter(
          (res: any) => res.status !== 'canceled' && res.status !== 'completed'
        );
        setReservations(activeReservations);
        setHistorico(reservationsData);

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.response?.data?.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [navigate]);

  // Load floors when building is selected
  useEffect(() => {
    const loadFloors = async () => {
      if (selectedValues.campus) {
        try {
          const buildingId = buildings.find(b => b.name === selectedValues.campus)?.id;
          if (buildingId) {
            const floorsData = await getFloors(buildingId);
            setFloors(floorsData);
          }
        } catch (err: any) {
          console.error('Error loading floors:', err);
          setError(err.response?.data?.message || "Erro ao carregar andares");
        }
      }
    };

    loadFloors();
  }, [selectedValues.campus, buildings]);

  // Load spaces when floor is selected
  useEffect(() => {
    const loadSpaces = async () => {
        if (selectedValues.campus && selectedValues.andar) {
            try {
                const building = buildings.find(b => b.name === selectedValues.campus);
                const floor = floors.find(f => f.name === selectedValues.andar);
                
                if (building?.id && floor?.id) {
                    const spacesData = await getSpaces(building.id, floor.id);
                    setSpaces(spacesData);
                } else {
                    // Reset spaces if we don't have valid IDs
                    setSpaces([]);
                }
            } catch (err: any) {
                console.error('Error loading spaces:', err);
                setError(err.response?.data?.message || "Erro ao carregar salas");
            }
        } else {
            // Reset spaces if we don't have both campus and floor selected
            setSpaces([]);
        }
    };

    loadSpaces();
  }, [selectedValues.andar, selectedValues.campus, buildings, floors]);

  // Update the space selection handler
  const handleSpaceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const spaceId = e.target.value;
    const space = spaces.find(s => s.id.toString() === spaceId);
    
    console.log('Selected space:', space); // Debug log
    
    setSelectedSpace(space || null);
    setSelectedValues(prev => ({
        ...prev,
        sala: spaceId
    }));
};

  // Função para verificar disponibilidade de um dia específico
  const checkDayAvailability = async (date: Date) => {
    if (!selectedValues.sala || !timeRange.start || !timeRange.end) {
        return 'disponivel';
    }

    try {
        const spaceId = parseInt(selectedValues.sala);
        if (isNaN(spaceId)) {
            return 'disponivel';
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        const startTime = timeRange.start;
        const endTime = timeRange.end;

        // Buscar TODAS as reservas (não apenas do usuário)
        const allReservations = await api.get('/api/reservations/', {
            params: { space: spaceId }
        });
        
        console.log('All reservations for space:', allReservations.data);
        
        const reservations = allReservations.data;

        // Verificar conflitos normais (reservas únicas)
        const hasTimeConflict = reservations?.some((res: any) => {
            if (res.is_recurring) return false;
            if (!res.date) return false;
            
            const resDate = format(new Date(res.date), 'yyyy-MM-dd');
            if (resDate !== dateStr) return false;
            
            const resStart = res.start_time?.substring(0, 5) || '';
            const resEnd = res.end_time?.substring(0, 5) || '';
            
            // Verifica sobreposição de horários
            return !(endTime <= resStart || startTime >= resEnd);
        });

        if (hasTimeConflict) {
            console.log(`Conflito encontrado no dia ${dateStr}`);
            return 'ocupado';
        }

        // Verificar conflitos com recorrências
        const hasRecurringConflict = reservations?.some((res: any) => {
            if (!res.is_recurring) return false;
            if (!res.recurring_days) return false;
            
            // Verificar se a data está dentro do período de recorrência
            const startDateRecurring = new Date(res.recurring_start_date);
            const endDateRecurring = new Date(res.recurring_end_date);
            
            if (date < startDateRecurring || date > endDateRecurring) return false;
            
            // Verificar se o dia da semana está nos dias recorrentes
            const dayOfWeek = date.getDay();
            const dayMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
            const dayCode = dayMap[dayOfWeek as keyof typeof dayMap];
            
            if (!res.recurring_days.includes(dayCode)) return false;
            
            const resStart = res.start_time?.substring(0, 5) || '';
            const resEnd = res.end_time?.substring(0, 5) || '';
            
            // Verifica sobreposição de horários
            return !(endTime <= resStart || startTime >= resEnd);
        });

        if (hasRecurringConflict) {
            console.log(`Conflito recorrente encontrado no dia ${dateStr}`);
            return 'ocupado-recorrente';
        }
        
        return 'disponivel';
    } catch (err) {
        console.error('Error checking availability:', err);
        return 'disponivel';
    }
  };

  // Função para carregar disponibilidade do mês atual
  const loadMonthAvailability = async () => {
    if (!selectedValues.sala || !timeRange.start || !timeRange.end || loadingAvailability) return;

    setLoadingAvailability(true);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newDayStatuses: DayStatus[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      // Pular dias passados
      if (date < today) {
        newDayStatuses.push({
          date: format(date, 'yyyy-MM-dd'),
          status: 'ocupado'
        });
        continue;
      }

      try {
        const status = await checkDayAvailability(date);
        
        // Log para debug
        console.log(`Checking availability for ${format(date, 'yyyy-MM-dd')}:`, {
          timeRange,
          status
        });
        
        newDayStatuses.push({
          date: format(date, 'yyyy-MM-dd'),
          status
        });
      } catch (error) {
        console.error(`Error checking day ${date.toLocaleDateString()}:`, error);
      }
    }

    setDayStatuses(newDayStatuses);
    setLoadingAvailability(false);
  };

  // Atualizar a função getDayClassName
  const getDayClassName = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (selectedDate.date && format(selectedDate.date, 'yyyy-MM-dd') === dateStr) {
      return 'selecionado';
    }

    const dayStatus = dayStatuses.find(d => d.date === dateStr);
    
    if (!dayStatus && date >= new Date()) {
      return 'disponivel';
    }

    return dayStatus?.status || 'ocupado';
  };

  // Carregar disponibilidade quando a sala ou mês mudar
  useEffect(() => {
    if (selectedValues.sala && timeRange.start && timeRange.end) {
      loadMonthAvailability();
    }
  }, [selectedValues.sala, timeRange.start, timeRange.end, currentDate]);

  // Replace API calls with dummy data
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (!storedProfile) {
      navigate('/login');
      return;
    }

    // Carrega todos os dados dummy de uma vez
    setUserProfile(JSON.parse(storedProfile));
    setBuildings(dummyBuildings);
    
    // Filtra as reservas para mostrar apenas as não canceladas/completadas em "Meus Agendamentos"
    const activeReservations = dummyReservations.filter(
      res => res.status !== 'canceled' && res.status !== 'completed'
    );
    
    setReservations(activeReservations);
    setHistorico(dummyReservations); // Histórico mostra todas as reservas
    setLoading(false);
  }, [navigate]);

  // Atualize a função scrollToBottom
  const scrollToBottom = () => {
    // Aumentar o timeout para dar tempo do calendário renderizar
    setTimeout(() => {
      const novoAgendamentoElement = novoAgendamentoRef.current;
      if (novoAgendamentoElement) {
        novoAgendamentoElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 300); // Aumentado para 300ms
  };

  // Adicionar um useEffect para monitorar mudanças que devem triggar o scroll
  useEffect(() => {
    if (selectedValues.sala && timeRange.start && timeRange.end) {
      scrollToBottom();
    }
  }, [selectedValues.sala, timeRange.start, timeRange.end]);

  const handleAddClick = () => {
    if (showNovoAgendamento) {
      // Se já estiver aberto, fecha
      setShowNovoAgendamento(false);
      setAgendamentoStep('campus'); // Reseta o estado do formulário
    } else {
      // Se estiver fechado, abre
      setShowNovoAgendamento(true);
    }
  };

  const handleEdit = async (reservation: Reservation) => {
    try {
      setShowNovoAgendamento(true);
      setAgendamentoStep('andar');
      setIsEditing(true); // Adicione este estado

      setSelectedValues({
        campus: reservation.building_name,
        andar: '',
        sala: ''
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Aqui vamos usar o floor_name que veio da reserva
      const floorName = reservation.floor_name || reservation.space_name.split(' ')[0];
      
      setSelectedValues(prev => ({
        ...prev,
        andar: floorName
      }));

      await new Promise(resolve => setTimeout(resolve, 100));

      setSelectedValues(prev => ({
        ...prev,
        andar: floorName,
        sala: reservation.space_name
      }));

      const startDate = new Date(reservation.start_datetime);
      const endDate = new Date(reservation.end_datetime);

      setSelectedDate({
        date: startDate,
        isAvailable: true
      });

      setTimeRange({
        start: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setBookingDetails({
        campus: reservation.building_name,
        andar: floorName,
        sala: reservation.space_name,
        data: startDate.toLocaleDateString(),
        horario: {
          inicio: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fim: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        curso: reservation.title || '',
        telefone: '',
        observacao: reservation.description || ''
      });

      scrollToBottom();

    } catch (error) {
      console.error('Erro ao preparar edição:', error);
      setError('Erro ao carregar dados para edição');
    }
  };

  // Adicione este estado para controlar as animações
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');

  // Adicione um novo estado para controlar animações
  const [animatingStep, setAnimatingStep] = useState<AgendamentoStep | null>(null);

  const nextStep: Record<AgendamentoStep, AgendamentoStep> = {
    'campus': 'andar',
    'andar': 'confirmacao',
    'sala': 'confirmacao',
    'confirmacao': 'resumo',
    'resumo': 'sucesso',
    'sucesso': 'campus'
};

  // Atualize a função handleNextStep
  const handleNextStep = async () => {
    setAnimatingStep(agendamentoStep);
    
    setTimeout(async () => {
        if (agendamentoStep === 'resumo') {
            try {
                console.log('Selected values:', selectedValues);
                
                const selectedSpace = spaces.find(space => space.id.toString() === selectedValues.sala);
                
                if (!selectedSpace) {
                    throw new Error('Sala não encontrada');
                }

                // Validar disponibilidade ANTES de criar a reserva
                if (!bookingDetails.isRecurring && selectedDate.date) {
                    const dateStr = format(selectedDate.date, 'yyyy-MM-dd');
                    
                    try {
                        const availability = await checkAvailability(selectedSpace.id, dateStr);
                        
                        // Verificar conflitos normais
                        const hasTimeConflict = availability.reservations?.some((res: any) => {
                            if (res.is_recurring) return false;
                            const resStart = res.start_time.substring(0, 5);
                            const resEnd = res.end_time.substring(0, 5);
                            // Verifica se há sobreposição: conflito se NOT (fim <= inicio reservado OU inicio >= fim reservado)
                            return !(timeRange.end <= resStart || timeRange.start >= resEnd);
                        });

                        // Verificar conflitos com recorrências
                        const hasRecurringConflict = availability.reservations?.some((res: any) => {
                            if (!res.is_recurring) return false;
                            // Verificar se o dia selecionado está nos dias recorrentes
                            const dayOfWeek = selectedDate.date.getDay();
                            const dayMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
                            const dayCode = dayMap[dayOfWeek as keyof typeof dayMap];
                            
                            if (!res.recurring_days?.includes(dayCode)) return false;
                            

                            const resStart = res.start_time.substring(0, 5);
                            const resEnd = res.end_time.substring(0, 5);
                            return !(timeRange.end <= resStart || timeRange.start >= resEnd);
                        });

                        if (hasTimeConflict || hasRecurringConflict) {
                            setError('❌ Horário indisponível! Essa sala já está ocupada nesse período.');
                            setAnimatingStep(null);
                            return;
                        }
                    } catch (error) {
                        console.error('Erro ao verificar disponibilidade:', error);
                        // Continua mesmo se houver erro na verificação
                    }
                }

                let reservationData: ReservationData;

                if (bookingDetails.isRecurring) {
                    // Reserva recorrente
                    reservationData = {
                        space: selectedSpace.id,
                        description: bookingDetails.observacao,
                        status: 'pending',
                        is_recurring: true,
                        recurring_days: bookingDetails.recurringDays,
                        recurring_start_date: bookingDetails.recurringStartDate,
                        recurring_end_date: bookingDetails.recurringEndDate,
                        recurring_horarios: bookingDetails.recurringHorarios
                    };
                } else {
                    // Reserva única
                    reservationData = {
                        space: selectedSpace.id,
                        date: selectedDate.date?.toISOString().split('T')[0] || '',
                        start_time: timeRange.start,
                        end_time: timeRange.end,
                        description: bookingDetails.observacao,
                        status: 'pending'
                    };
                }

                console.log('Creating reservation:', reservationData);
                const newReservation = await createReservation(reservationData);
                console.log('Reservation created successfully:', newReservation);
                
                setReservations(prev => [...prev, newReservation]);
                setHistorico(prev => [...prev, newReservation]);
                
                setAgendamentoStep('sucesso');
                setAnimatingStep(null);
            } catch (error: any) {
                console.error('Error creating reservation:', error);
                setError(error.message || 'Erro ao criar agendamento');
                setAnimatingStep(null);
            }
        } else if (agendamentoStep === 'andar') {
            if (!bookingDetails.isRecurring) {
                setBookingDetails(prev => ({
                    ...prev,
                    data: selectedDate.date ? format(selectedDate.date, 'dd/MM/yyyy') : '',
                    horario: {
                        inicio: timeRange.start,
                        fim: timeRange.end
                    }
                }));
            } else {
                setBookingDetails(prev => ({
                    ...prev,
                    data: `${format(new Date(bookingDetails.recurringStartDate), 'dd/MM/yyyy')} até ${format(new Date(bookingDetails.recurringEndDate), 'dd/MM/yyyy')}`,
                    horario: {
                        inicio: bookingDetails.recurringDays[0] ? bookingDetails.recurringHorarios[bookingDetails.recurringDays[0]].inicio : '',
                        fim: bookingDetails.recurringDays[0] ? bookingDetails.recurringHorarios[bookingDetails.recurringDays[0]].fim : ''
                    }
                }));
            }
            
            setAgendamentoStep('confirmacao');
            setAnimatingStep(null);
        } else {
            const nextSteps: Record<AgendamentoStep, AgendamentoStep> = {
                'campus': 'andar',
                'andar': 'confirmacao',
                'sala': 'confirmacao',
                'confirmacao': 'resumo',
                'resumo': 'sucesso',
                'sucesso': 'campus'
            };
            
            const next = nextSteps[agendamentoStep];
            if (next) {
                setError(null);
                setAgendamentoStep(next);
                setAnimatingStep(null);
            }
        }
    }, 150);
};

  // Atualize a função handleBackStep
  const handleBackStep = () => {
    setAnimatingStep(agendamentoStep);
    
    setTimeout(() => {
        if (agendamentoStep === 'resumo') {
            setAgendamentoStep('confirmacao');
        } else if (agendamentoStep === 'confirmacao') {
            setAgendamentoStep('andar');
        } else if (agendamentoStep === 'andar') {
            setAgendamentoStep('campus');
        }
        
        setAnimatingStep(null);
    }, 150);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isFirstMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isTimeAndLocationSelected = () => {
    return (
      selectedValues.andar !== '' &&
      selectedValues.sala !== '' &&
      timeRange.start !== '' &&
      timeRange.end !== ''
    );
  };

  // Adicione uma nova função para verificar se pode prosseguir
  const canProceedToNext = () => {
    return (
      selectedValues.andar !== '' &&
      selectedValues.sala !== '' &&
      timeRange.start !== '' &&
      timeRange.end !== '' &&
      selectedDate.date !== null
    );
  };

  // Funções auxiliares
  const formatUsername = (username: string) => {
    return username.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const mapStatusToClassName = (status: string) => {
    const statusMap: Record<string, string> = {
      'confirmado': 'confirmado',
      'pending': 'pendente',
      'canceled': 'cancelado',
      'completed': 'concluido' // Changed from 'Concluído' to 'concluido'
    };
    return statusMap[status] || status;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'confirmado': 'Confirmado',
      'pending': 'Pendente',
      'canceled': 'Cancelado',
      'completed': 'Concluído' // This can stay capitalized as it's display text
    };
    return statusMap[status] || status;
  };

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Função para selecionar data
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate({
      date,
      isAvailable: true
    });
  };

  // Função para resetar agendamento
  const resetAgendamento = () => {
    setShowNovoAgendamento(false);
    setAgendamentoStep('campus');
    setSelectedValues({ campus: '', andar: '', sala: '' });
    setTimeRange({ start: '', end: '' });
    setSelectedDate({ date: null, isAvailable: true });
    setBookingDetails({
      campus: '',
      andar: '',
      sala: '',
      data: '',
      horario: { inicio: '', fim: '' },
      curso: '',
      telefone: '',
      observacao: '',
      isRecurring: false,
      recurringDays: [],
      recurringStartDate: '',
      recurringEndDate: '',
      recurringHorarios: {
        seg: { inicio: '', fim: '' },
        ter: { inicio: '', fim: '' },
        qua: { inicio: '', fim: '' },
        qui: { inicio: '', fim: '' },
        sex: { inicio: '', fim: '' },
        sab: { inicio: '', fim: '' },
        dom: { inicio: '', fim: '' }
      }
    });
  };

  // Funções para lidar com cancelamento
  const handleCancelConfirm = async () => {
    if (reservationToCancel) {
      try {
        // await cancelReservation(reservationToCancel);
        
        const canceledReservation = reservations.find(r => r.id === reservationToCancel);
        if (canceledReservation) {
          // Atualizar o status localmente
          const updatedReservations = reservations.map(r => 
            r.id === reservationToCancel 
              ? { ...r, status: 'canceled' as const } 
              : r
          );
          setReservations(updatedReservations);
          setHistorico(updatedReservations);
        }
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        setError('Erro ao cancelar a reserva');
      }
    }
    setShowCancelConfirmation(false);
    setReservationToCancel(null);
  };

  const handleCancelClose = () => {
    setShowCancelConfirmation(false);
    setReservationToCancel(null);
  };

  // useEffect para carregar dados iniciais
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (!storedProfile) {
      navigate('/login');
      return;
    }
    setUserProfile(JSON.parse(storedProfile));
    setBuildings(dummyBuildings);
    setReservations(dummyReservations);
    setHistorico(dummyReservations);
    setLoading(false);
  }, [navigate]);

  // Carrega os andares quando um campus é selecionado
  useEffect(() => {
    if (selectedValues.campus) {
      const building = dummyBuildings.find(b => b.name === selectedValues.campus);
      if (building) {
        const buildingFloors = dummyFloors.filter(f => f.building_id === building.id);
        setFloors(buildingFloors);
      }
    }
  }, [selectedValues.campus]);

  // Carrega as salas quando um andar é selecionado
  useEffect(() => {
    if (selectedValues.andar) {
      const floor = dummyFloors.find(f => f.name === selectedValues.andar);
      if (floor) {
        const floorRooms = dummyRooms.filter(r => r.floor_id === floor.id);
        setSpaces(floorRooms);
      }
    }
  }, [selectedValues.andar]);

  // Adicione logs para debug
  useEffect(() => {
    const loadReservations = async () => {
        try {
            const data = await getUserReservations();
            console.log('Raw reservation data:', data); // Debug log
            
            if (Array.isArray(data)) {
                setReservations(data);
                setHistorico(data);
            } else {
                console.error('Invalid data format:', data);
                setReservations([]);
                setHistorico([]);
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            setReservations([]);
            setHistorico([]);
        }
    };

    loadReservations();
}, []);

// Na linha 759, adicione verificação segura:
{historico
    .filter(res => res && res.id) // Filtra itens válidos
    .sort((a, b) => {
        try {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
        } catch {
            return 0;
        }
    })
    .slice(0, mostrarTodoHistorico ? undefined : 2)
    .map(reservation => {
        if (!reservation || !reservation.id) return null;
        
        return (
            <div key={reservation.id} className={`historico-card ${mapStatusToClassName(reservation.status)} ${!showNovoAgendamento ? 'full-width' : ''}`}>
                <div className="historico-tags">
                    <span className={`tag tag-status ${mapStatusToClassName(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                    </span>
                    {reservation.start_time && reservation.end_time && (
                        <span className="tag tag-time">
                            {`${reservation.start_time.slice(0,5)} - ${reservation.end_time.slice(0,5)}`}
                        </span>
                    )}
                    {reservation.date && (
                        <span className="tag tag-date">
                            {new Date(reservation.date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        );
    })}
  return (
    <div className="agendamento-container">
      <header className="header">
        <div className="blue-bar">
          <button className="logout-button" onClick={handleLogout}>
            <img src={LogoutIcon} alt="Sair" />
          </button>
        </div>
        <div className="white-bar">
          <img src={logoImg} alt="Logo" className="logo" />
          <div className="user-bar">
            <img 
              src={userProfile?.profile_photo || userImg} 
              alt="Perfil" 
              className="user-photo" 
            />
            <div className="user-info">
              <span className="welcome">Bem-vindo!</span>
              <span className="username">{userProfile ? formatUsername(userProfile.username) : 'Carregando...'}</span>
            </div>
            <button className="add-button" onClick={handleAddClick}>
              <img src={PlusIcon} alt="Adicionar" className="plus-icon" />
              <span className="desktop-only">Agendar</span>
            </button>
          </div>
          <button className="logout-button desktop-only" onClick={handleLogout}>
            <img src={LogoutIcon} alt="Sair" />
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="proximos-agendamentos">
          <h2>Meus agendamentos</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="agendamentos-list">
                {reservations
                    .filter(res => res && res.id && res.status !== 'canceled' && res.status !== 'completed')
                    .slice(0, mostrarTodosAgendamentos ? undefined : 2)
                    .map(reservation => {
                        if (!reservation) return null;
                        
                        const startTime = reservation.start_time ? reservation.start_time.slice(0, 5) : 'N/A';
                        const endTime = reservation.end_time ? reservation.end_time.slice(0, 5) : 'N/A';
                        const date = reservation.date ? new Date(reservation.date).toLocaleDateString() : 'N/A';
                        
                        return (
                            <div key={reservation.id} className={`agendamento-card ${!showNovoAgendamento ? 'full-width' : ''}`}>
                                <div className="card-content">
                                    <div className="card-left">
                                        <div className="building-icon">
                                            <img src={Campusico} alt="Campus" className="campus-icon" />
                                            <span className="campus-name">{reservation.building_name}</span>
                                        </div>
                                    </div>
                                    <div className="card-right">
                                        <div className="local-details">
                                            <h3>{reservation.space_name}</h3>
                                        </div>
                                        <div className="agendamento-info">
                                            <p>{date}</p>
                                            <p>{`${startTime} - ${endTime}`}</p>
                                            <p>{`${reservation.capacity} pessoas`}</p>
                                        </div>
                                        <div className="header-buttons">
                                            <button className="edit-button" onClick={() => handleEdit(reservation)}>
                                                Editar
                                            </button>
                                            <button 
                                                className="cancel-button-small" 
                                                onClick={() => {
                                                    setReservationToCancel(reservation.id);
                                                    setShowCancelConfirmation(true);
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
              </div>
              {reservations.length > 2 && (
                <button
                  className="ver-mais"
                  onClick={() => setMostrarTodosAgendamentos(!mostrarTodosAgendamentos)}
                >
                  {mostrarTodosAgendamentos ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </>
          )}
        </section>

        <section className="historico">
          <h2>Histórico de agendamento</h2>
          <div className="historico-list">
            {historico
                .filter(res => res && res.id) // Filtra itens válidos
                .sort((a, b) => {
                    try {
                        const dateA = new Date(a.date || 0);
                        const dateB = new Date(b.date || 0);
                        return dateB.getTime() - dateA.getTime();
                    } catch {
                        return 0;
                    }
                })
                .slice(0, mostrarTodoHistorico ? undefined : 2)
                .map(reservation => {
                    if (!reservation || !reservation.id) return null;
                    
                    // Proteção adicional para start_time e end_time
                    const startTime = reservation.start_time ? reservation.start_time.slice(0, 5) : 'N/A';
                    const endTime = reservation.end_time ? reservation.end_time.slice(0, 5) : 'N/A';
                    const date = reservation.date ? new Date(reservation.date).toLocaleDateString() : 'N/A';
                    
                    return (
                        <div key={reservation.id} className={`historico-card ${mapStatusToClassName(reservation.status)} ${!showNovoAgendamento ? 'full-width' : ''}`}>
                            <div className="historico-tags">
                                <span className={`tag tag-status ${mapStatusToClassName(reservation.status)}`}>
                                    {getStatusText(reservation.status)}
                                </span>
                                <span className="tag tag-time">
                                    {`${startTime} - ${endTime}`}
                                </span>
                                <span className="tag tag-date">
                                    {date}
                                </span>
                            </div>
                            <div className="historico-location">
                                <div className="location-row">
                                    <img src={Campusico} alt="Campus" className="location-icon" />
                                    <span className="location-name">{reservation.space_name || 'Sala não definida'}</span>
                                </div>
                                <div className="location-row">
                                    <img src={PingIcon} alt="Location" className="location-icon" />
                                    <span className="location-campus">{reservation.building_name || 'Campus não definido'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
          </div>
          {historico.length > 2 && (
            <button
              className="ver-mais"
              onClick={() => setMostrarTodoHistorico(!mostrarTodoHistorico)}
            >
              {mostrarTodoHistorico ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </section>

        {showNovoAgendamento && (
          <section className="novo-agendamento" ref={novoAgendamentoRef}>
            <h2>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            {agendamentoStep === 'campus' ? (
              <>
                <div className="filtro">
                  <label>{stepContentsDynamic.campus.label}</label>
                  <select 
                    value={selectedValues.campus}
                    onChange={(e) => setSelectedValues({
                      ...selectedValues,
                      campus: e.target.value,
                      andar: '',
                      sala: ''
                    })}
                    >
                    <option value="">{stepContentsDynamic.campus.placeholder}</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.name}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>

                  {error && (
                    <div className="error-message">
                      <p>{error}</p>
                    </div>
                  )}
                <div className="action-buttons">
                  <button 
                    className="search-button" 
                    onClick={handleNextStep}
                    disabled={!selectedValues.campus}
                  >
                    <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
                  </button>
                </div>
              </>
            ) : agendamentoStep === 'andar' ? (
              <>
                <div className="agendamento-details">
      <div className="select-row">
        <div className="select-group">
          <label>Andar</label>
          <select 
            value={selectedValues.andar}
            onChange={(e) => setSelectedValues({
              ...selectedValues,
              andar: e.target.value,
              sala: ''
            })}
          >
            <option value="">Escolher Andar</option>
            {floors.map(floor => (
              <option key={floor.id} value={floor.name}>
                {floor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label>Sala</label>
          <select 
            value={selectedValues.sala}
            onChange={handleSpaceSelect}
            disabled={!selectedValues.andar}
          >
            <option value="">Selecione uma sala</option>
            {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                    {space.name}
                </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={`recurring-toggle ${bookingDetails.isRecurring ? 'active' : ''}`}
          onClick={() => {
            setBookingDetails({
              ...bookingDetails,
              isRecurring: !bookingDetails.isRecurring,
              recurringDays: [],
              recurringHorarios: {
                seg: { inicio: '', fim: '' },
                ter: { inicio: '', fim: '' },
                qua: { inicio: '', fim: '' },
                qui: { inicio: '', fim: '' },
                sex: { inicio: '', fim: '' },
                sab: { inicio: '', fim: '' },
                dom: { inicio: '', fim: '' }
              }
            });
            setTimeRange({ start: '', end: '' });
            setSelectedDate({ date: null, isAvailable: true });
          }}
        >
          <input
            type="checkbox"
            checked={bookingDetails.isRecurring}
            onChange={() => {}} // Controlado pelo onClick do button
          />
          Reserva Recorrente
        </button>
      </div>

      {!bookingDetails.isRecurring ? (
        <>
          <div className="time-selection">
            <label>Selecione o horário</label>
            <div className="time-inputs">
              <div className="time-group">
                <label>Começo</label>
                <input
                  type="time"
                  value={timeRange.start}
                  onChange={(e) => setTimeRange({...timeRange, start: e.target.value})}
                  min="07:00"
                  max="22:00"
                />
              </div>
              <div className="time-group">
                <label>Término</label>
                <input
                  type="time"
                  value={timeRange.end}
                  onChange={(e) => setTimeRange({...timeRange, end: e.target.value})}
                  min="07:00"
                  max="22:00"
                />
              </div>
            </div>
          </div>

          {selectedValues.sala && timeRange.start && timeRange.end && (
            <div className="calendar-section">
              <DatePicker
                selected={selectedDate.date}
                onChange={(date: Date | null) => {
                  if (date) {
                    handleDateSelect(date);
                  }
                }}
                inline
                locale={ptBR}
                minDate={new Date()}
                showMonthYearPicker={false}
                monthsShown={1}
                fixedHeight
                openToDate={currentDate}
                filterDate={(date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayStatus = dayStatuses.find(d => d.date === dateStr);
                  return dayStatus?.status !== 'ocupado' && dayStatus?.status !== 'ocupado-recorrente';
                }}
                dayClassName={(date) => {
                  if (date < new Date()) {
                    return 'ocupado';
                  }
                  return getDayClassName(date);
                }}
                renderCustomHeader={({ date }) => (
                  <div className="calendar-header">
                    <div className="month-navigation">
                      <button 
                        className="calendar-nav prev" 
                        onClick={handlePrevMonth}
                        disabled={isFirstMonth(currentDate)}
                      >
                        <img src={RightArrowIcon} alt="Mês anterior" className="back-icon" />
                      </button>
                      <span className="month-title">
                        {format(date, 'MMMM yyyy', { locale: ptBR })}
                        {loadingAvailability && ' (Carregando...)'}
                      </span>
                      <button className="calendar-nav next" onClick={handleNextMonth}>
                        <img src={RightArrowIcon} alt="Próximo mês" className="arrow-icon" />
                      </button>
                    </div>
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <span className="legend-dot disponivel"></span>
                        <span>Disponível</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot ocupado"></span>
                        <span>Ocupado</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot ocupado-recorrente"></span>
                        <span>Ocupado Recorrente</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot selecionado"></span>
                        <span>Selecionado</span>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </>
      ) : (
        <div className="recurring-section">
          <div className="form-group">
            <label style={{ marginBottom: '16px' }}>Selecione os dias da semana</label>
            <div className="days-selector">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day, index) => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={bookingDetails.recurringDays.includes(day)}
                    onChange={(e) => {
                      const newDays = e.target.checked
                        ? [...bookingDetails.recurringDays, day]
                        : bookingDetails.recurringDays.filter(d => d !== day);
                      setBookingDetails({
                        ...bookingDetails,
                        recurringDays: newDays
                      });
                    }}
                  />
                  <span>{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][index]}</span>
                </label>
              ))}

              {/* Adicionando margens para os checkboxes */}
              <style>
                {`
                  .days-selector {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                  }
                `}
              </style>
            </div>
          </div>

          {bookingDetails.recurringDays.map(day => (
            <div key={day} className="form-group">
              <label>Horário para {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].indexOf(day)]}</label>
              <div className="time-inputs">
                <div className="time-group">
                  <label>Começo</label>
                  <input
                    type="time"
                    value={bookingDetails.recurringHorarios[day].inicio}
                    onChange={(e) => setBookingDetails({
                      ...bookingDetails,
                      recurringHorarios: {
                        ...bookingDetails.recurringHorarios,
                        [day]: { ...bookingDetails.recurringHorarios[day], inicio: e.target.value }
                      }
                    })}
                    min="07:00"
                    max="22:00"
                  />
                </div>
                <div className="time-group">
                  <label>Término</label>
                  <input
                    type="time"
                    value={bookingDetails.recurringHorarios[day].fim}
                    onChange={(e) => setBookingDetails({
                      ...bookingDetails,
                      recurringHorarios: {
                        ...bookingDetails.recurringHorarios,
                        [day]: { ...bookingDetails.recurringHorarios[day], fim: e.target.value }
                      }
                    })}
                    min="07:00"
                    max="22:00"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="form-group">
            <label>Data de Início</label>
            <input
              type="date"
              value={bookingDetails.recurringStartDate}
              onChange={(e) => setBookingDetails({
                ...bookingDetails,
                recurringStartDate: e.target.value
              })}
            />
          </div>

          <div className="form-group">
            <label>Data de Término</label>
            <input
              type="date"
              value={bookingDetails.recurringEndDate}
              onChange={(e) => setBookingDetails({
                ...bookingDetails,
                recurringEndDate: e.target.value
              })}
            />
          </div>
        </div>
      )}
    </div>

    <div className="action-buttons">
      <button 
        className="back-button" 
        onClick={handleBackStep}
        disabled={agendamentoStep === 'campus' as AgendamentoStep}
      >
        <img src={RightArrowIcon} alt="Voltar" className="back-icon" />
      </button>
      <button 
        className="search-button" 
        onClick={handleNextStep}
        disabled={
          !selectedValues.andar || !selectedValues.sala ||
          (bookingDetails.isRecurring
            ? (bookingDetails.recurringDays.length === 0 || 
               !bookingDetails.recurringStartDate || 
               !bookingDetails.recurringEndDate ||
               bookingDetails.recurringDays.some(day => 
                 !bookingDetails.recurringHorarios[day].inicio || 
                 !bookingDetails.recurringHorarios[day].fim
               ))
            : (!timeRange.start || !timeRange.end || !selectedDate.date))
        }
      >
        <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
      </button>
    </div>
  </>
) : agendamentoStep === 'confirmacao' ? (
  <div className={`confirmacao-agendamento ${animatingStep === 'confirmacao' ? 'animating-out' : ''} ${animatingStep === 'resumo' ? 'animating-backward' : ''}`}>
    <div className="selected-details">
      <div className="detail-chip-location">
        <img src={Campusico} alt="Campus" />
        <span>{selectedValues.campus || 'Campus não selecionado'}</span>
      </div>
      <div className="detail-chip-location">
        <img src={PingIcon} alt="Location" />
        <span>{
          selectedValues.sala 
            ? spaces.find(s => s.id.toString() === selectedValues.sala)?.name || 'Sala não selecionada'
            : 'Sala não selecionada'
        }</span>
      </div>
      <div className="detail-chip-time">
        <img src={Calendario} alt="Data" />
        <span>{bookingDetails.data || (bookingDetails.isRecurring ? 'Recorrente' : 'Não selecionado')}</span>
      </div>
      <div className="detail-chip-time">
        <img src={Relogio} alt="Horário" />
        <span>{`${bookingDetails.horario.inicio} às ${bookingDetails.horario.fim}`}</span>
      </div>
    </div>

    <div className="form-group">
      <label>Insira o curso</label>
      <div className="input-with-icon">
        <img src={ChapeuIcon} alt="Curso" className="input-icon" />
        <input
          type="text"
          placeholder="Curso"
          value={bookingDetails.curso}
          onChange={(e) => setBookingDetails({
            ...bookingDetails,
            curso: e.target.value
          })}
        />
      </div>
    </div>

    <div className="form-group">
      <label>Telefone para contato</label>
      <div className="input-with-icon">
        <img src={TelefoneIcon} alt="Telefone" className="input-icon" />
        <input
          type="tel"
          placeholder="(XX) XXXXX-XXXX"
          value={bookingDetails.telefone}
          onChange={(e) => setBookingDetails({
            ...bookingDetails,
            telefone: validatePhoneInput(e.target.value)
          })}
          maxLength={20}
        />
      </div>
    </div>

    <div className="form-group">
      <label>Observações da reserva (Opcional)</label>
      <div className="input-with-icon">
        <img src={MensagemIcon} alt="Observação" className="input-icon" />
        <textarea
          placeholder="Observação"
          value={bookingDetails.observacao}
          onChange={(e) => setBookingDetails({
            ...bookingDetails,
            observacao: e.target.value
          })}
        />
      </div>
    </div>

    <div className="action-buttons">
      <button className="back-button" onClick={handleBackStep}>
        <img src={RightArrowIcon} alt="Voltar" className="back-icon" />
      </button>
      <button 
        className="search-button" 
        onClick={handleNextStep}
        disabled={!bookingDetails.curso || !bookingDetails.telefone}
      >
        <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
      </button>
    </div>
  </div>
) : agendamentoStep === 'resumo' ? (
  <div className={`resumo-agendamento ${animatingStep === 'resumo' ? 'animating-out' : ''} ${animatingStep === 'confirmacao' ? 'animating-backward' : ''}`}>
    <h2>Resumo</h2>
    
    <div className="resumo-content">
      <div className="resumo-group">
        <div className="resumo-item">
          <span className="label">Campus:</span>
          <span className="value">{selectedValues.campus || 'Não selecionado'}</span>
        </div>
        <div className="resumo-item">
          <span className="label">Sala:</span>
          <span className="value">{
            selectedValues.sala 
              ? spaces.find(s => s.id.toString() === selectedValues.sala)?.name || 'Sala não selecionada'
              : 'Sala não selecionada'
          }</span>
        </div>
      </div>

      <div className="resumo-group">
        <div className="resumo-item">
          <span className="label-2">Data:</span>
          <span className="value">{bookingDetails.data}</span>
        </div>
        <div className="resumo-item">
          <span className="label-2">Horário:</span>
          <span className="value">{`${bookingDetails.horario.inicio} às ${bookingDetails.horario.fim}`}</span>
        </div>
      </div>

      <div className="resumo-group">
        <div className="resumo-item">
          <span className="label-2">Curso:</span>
          <span className="value">{bookingDetails.curso}</span>
        </div>
        <div className="resumo-item">
          <span className="label-2">Contato:</span>
          <span className="value">{bookingDetails.telefone}</span>
        </div>
      </div>

      {bookingDetails.observacao && (
        <div className="resumo-group">
          <div className="resumo-item">
            <span className="label-2">Obs:</span>
            <span className="value">{bookingDetails.observacao}</span>
          </div>
        </div>
      )}
    </div>

    <div className="action-buttons">
      <button className="back-button" onClick={handleBackStep}>
        <img src={RightArrowIcon} alt="Voltar" className="back-icon" />
      </button>
      <button className="confirm-button" onClick={handleNextStep}>
        <img src={CheckIcon} alt="Confirmar" />
        <span>Confirmar</span>
      </button>
    </div>
  </div>
) : agendamentoStep === 'sucesso' ? (
  <div className={`novo-agendamento sucesso-agendamento ${animatingStep === 'sucesso' ? 'animating-out' : ''}`}>
    <div className="sucesso-content">
      <div className="big-check-icon">✓</div>
      <h2>Agendamento Pendente!</h2>
      <p className="sucesso-message">
        Seu pedido de agendamento será analisado!
      </p>
      <p className="sucesso-submessage">
        Mandaremos uma mensagem para <a href="#">avisar da sua reserva</a>
      </p>
    </div>

    <div className="action-buttons">
      <button className="conclude-button" onClick={resetAgendamento}>
        <span>Concluir</span>
      </button>
    </div>
  </div>
) : null}
          </section>
        )}
        
      </main>

      {/* Componente de confirmação de cancelamento */}
      {showCancelConfirmation && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>Isso irá apagar o Agendamento, tem certeza?</p>
            <div className="popup-buttons">
              <button className="popup-button cancel" onClick={handleCancelConfirm}>
                Sim, Cancelar
              </button>
              <button className="popup-button no" onClick={handleCancelClose}>
                Não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const extractRoomName = (fullName: string) => {
  const matches = fullName.match(/[-/]\s*([^-/]+)$/);
  if (matches && matches[1]) {
    return matches[1].trim();
  }
  return fullName;
};