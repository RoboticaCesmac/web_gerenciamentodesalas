import React, { useState, useEffect, useRef } from 'react';
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
  cancelReservation  // Adicione esta importação
} from '../../services/api';
import LogoutIcon from '../../assets/Sair.svg';

interface StepContent {
  title: string;
  label: string;
  placeholder: string;
  options: string[];
}

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
}

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
}

interface Reservation {
  id: number;
  title: string;
  description: string;
  space: number;
  space_name: number;
  building: number;
  building_name: string;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'canceled';
  user_email: string;
  capacity: number;
}

interface Building {
  id: number;
  name: string;
}

interface Floor {
  id: number;
  name: string;  // Isso vai receber o floor_name do backend
}

interface Space {
  id: number;
  name: string;
}

export const Agendamento = (): JSX.Element => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [historico, setHistorico] = useState<Reservation[]>([]);
  const [mostrarTodosAgendamentos, setMostrarTodosAgendamentos] = useState(false);
  const [mostrarTodoHistorico, setMostrarTodoHistorico] = useState(false);
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false);
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
    observacao: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Novos estados para disponibilidade
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const novoAgendamentoRef = useRef<HTMLDivElement>(null);

  // Estados para confirmação de cancelamento
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(null);

  // Função para verificar disponibilidade de um dia específico
  const checkDayAvailability = async (date: Date) => {
    if (!selectedValues.sala || !timeRange.start || !timeRange.end) return 'disponivel';
    
    const selectedSpace = spaces.find(space => space.name === selectedValues.sala);
    if (!selectedSpace) return 'disponivel';

    try {
      const startDateTime = new Date(date);
      const [startHours, startMinutes] = timeRange.start.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(date);
      const [endHours, endMinutes] = timeRange.end.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const response = await api.get(`/api/spaces/${selectedSpace.id}/availability/`, {
        params: {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        }
      });

      if (!response.data.is_available) {
        const conflicts = response.data.conflicting_reservations || [];
        // Se todas as reservas são do usuário atual, mostrar como disponível
        const allMine = conflicts.every((conflict: any) => conflict.user === userProfile?.id);
        return allMine ? 'disponivel' : 'ocupado';
      }

      return 'disponivel';
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        console.log('Profile data:', profile);
        setUserProfile(profile);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const data = await getBuildings();
        console.log('Buildings received:', data);
        setBuildings(data);
      } catch (err) {
        console.error('Erro ao carregar prédios:', err);
      }
    };

    fetchBuildings();
  }, []);

  useEffect(() => {
    const fetchFloors = async () => {
      if (selectedValues.campus) {
        const building = buildings.find(b => b.name === selectedValues.campus);
        console.log('Selected building:', building);
        if (building?.id) {
          try {
            const data = await getFloorsByBuilding(building.id);
            console.log('Floors received:', data);
            setFloors(data);
          } catch (err) {
            console.error('Erro ao carregar andares:', err);
          }
        }
      }
    };
    fetchFloors();
  }, [selectedValues.campus, buildings]);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (selectedValues.andar) {
        const floor = floors.find(f => f.name === selectedValues.andar);
        console.log('Selected floor:', floor);
        if (floor?.id) {
          try {
            const data = await getSpacesByFloor(floor.id);
            console.log('Spaces received:', data);
            setSpaces(data);
          } catch (err) {
            console.error('Erro ao carregar salas:', err);
            setError('Erro ao carregar salas disponíveis');
          }
        }
      }
    };
    fetchSpaces();
  }, [selectedValues.andar, floors]);

  const stepContentsDynamic = {
    campus: {
      title: 'Campus',
      label: 'Campus',
      placeholder: 'Escolher Campus',
      options: buildings.map(building => ({
        value: building.name,
        label: building.name
      }))
    },
    details: {
      title: 'Novo Agendamento',
      sections: [
        {
          label: 'Andar',
          placeholder: 'Escolher Andar',
          options: floors.map(floor => ({
            value: floor.name,
            label: floor.name
          }))
        },
        {
          label: 'Sala',
          placeholder: 'Escolher Sala',
          options: spaces.map(space => ({
            value: space.name,
            label: space.name
          }))
        },
        {
          label: 'Horário',
          type: 'time-range'
        },
        {
          label: 'Data',
          type: 'calendar'
        }
      ]
    }
  };

  // Atualizar a função scrollToBottom
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
    setShowNovoAgendamento(true);
    setAgendamentoStep('campus');
    scrollToBottom();
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

  const handleNextStep = async () => {
    if (agendamentoStep === 'andar' && !canProceedToNext()) {
      return;
    }
    
    if (agendamentoStep === 'resumo') {
      try {
        const [day, month, year] = bookingDetails.data.split('/');
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        // Criar datas com timezone de Brasília
        const offset = '-03:00';
        const startDate = new Date(`${formattedDate}T${bookingDetails.horario.inicio}:00${offset}`);
        const endDate = new Date(`${formattedDate}T${bookingDetails.horario.fim}:00${offset}`);

        // Verificar disponibilidade
        const availabilityResponse = await api.get(`/api/spaces/${selectedSpace.id}/availability/`, {
          params: {
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString()
          }
        });

        console.log('Verificando disponibilidade:', {
          start: startDate.toLocaleString(),
          end: endDate.toLocaleString(),
          response: availabilityResponse.data
        });

        if (!availabilityResponse.data.is_available) {
          const conflicts = availabilityResponse.data.conflicting_reservations;
          if (conflicts && conflicts.length > 0) {
            const conflictMessages = conflicts.map((conflict: any) => {
              const conflictStart = new Date(conflict.start_datetime);
              const conflictEnd = new Date(conflict.end_datetime);
              return `${conflictStart.toLocaleTimeString()} - ${conflictEnd.toLocaleTimeString()}`;
            }).join('\n');
            
            setError(`Horário indisponível. Já existe(m) reserva(s) para:\n${conflictMessages}`);
            return;
          }
        }

        // Se disponível, criar a reserva
        const reservationData = {
          space: selectedSpace.id,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          title: bookingDetails.curso,
          description: bookingDetails.observacao || '',
          phone: bookingDetails.telefone
        };

        console.log('Criando reserva:', reservationData);

        const response = await createReservation(reservationData);
        
        if (response.ok) {
          setAgendamentoStep('sucesso');
          const updatedReservations = await getUserReservations();
          setReservations(updatedReservations);
          // Após criar a reserva com sucesso, aguarde um pouco e resete
          setTimeout(() => {
            resetAgendamento();
          }, 2000);
        } else {
          setError(response.error || 'Erro ao criar reserva');
        }
      } catch (err) {
        console.error('Erro:', err);
        setError('Erro ao criar agendamento. Tente novamente.');
      }
    } else {
      // Handle other steps as before
      if (agendamentoStep === 'campus' && selectedValues.campus) {
        setAgendamentoStep('andar');
      } else if (agendamentoStep === 'andar' && isTimeAndLocationSelected()) {
        setBookingDetails(prev => ({
          ...prev,
          campus: selectedValues.campus,
          andar: selectedValues.andar,
          sala: selectedValues.sala,
          data: selectedDate.date ? selectedDate.date.toLocaleDateString() : '',
          horario: {
            inicio: timeRange.start,
            fim: timeRange.end
          }
        }));
        setAgendamentoStep('confirmacao');
      } else if (agendamentoStep === 'confirmacao' && bookingDetails.curso && bookingDetails.telefone) {
        setAgendamentoStep('resumo');
      }
      scrollToBottom();
    }
  };

  const handleBackStep = () => {
    if (agendamentoStep === 'resumo') {
      setAgendamentoStep('confirmacao');
    } else if (agendamentoStep === 'confirmacao') {
      setAgendamentoStep('andar');
    } else if (agendamentoStep === 'andar') {
      setAgendamentoStep('campus');
    }
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

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userProfileData = await getUserProfile();
        const reservationsData = await getUserReservations();
        
        setUserProfile(userProfileData);
        setReservations(reservationsData);
        setHistorico(reservationsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar agendamentos');
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const mapStatusToClassName = (status: string) => {
    const statusMap: Record<string, string> = {
      'approved': 'confirmado',
      'pending': 'pendente',
      'rejected': 'cancelado',
      'completed': 'concluido',
      'canceled': 'cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      'approved': 'Confirmado',
      'pending': 'Pendente',
      'rejected': 'Cancelado',
      'completed': 'Concluído',
      'canceled': 'Cancelado'
    };
    return statusTextMap[status] || status;
  };

  const renderAgendamentos = () => {
    if (loading) return <p>Carregando...</p>;
    if (error) return <p>{error}</p>;

    // Filtrar apenas agendamentos ativos (não cancelados) e ordenar por data/hora (mais próximo primeiro)
    const activeReservations = reservations
      .filter(res => res.status !== 'canceled' && res.status !== 'rejected') // Remove cancelados e rejeitados
      .sort((a, b) => {
        // Ordenar por data/hora - o mais próximo primeiro
        const dateA = new Date(a.start_datetime);
        const dateB = new Date(b.start_datetime);
        // Invertendo a ordenação (B - A ao invés de A - B)
        return dateA.getTime() - dateB.getTime();
      });

    if (activeReservations.length === 0) return <p>Nenhum agendamento ativo.</p>;

    const reservationsToShow = mostrarTodosAgendamentos 
      ? activeReservations 
      : activeReservations.slice(0, 3);

    return (
      <>
        {reservationsToShow.map((reservation) => (
          <div key={reservation.id} className="agendamento-card">
            <div className="card-content">
              <div className="building-icon">
                <img src={Campusico} alt="Campus" className="campus-icon" />
                <span className="campus-name">{reservation.building_name}</span>
              </div>
              <div className="card-right">
                <div className="local-details">
                  <h3>{reservation.space_name}</h3>
                </div>
                <div className="agendamento-info">
                  <p>{new Date(reservation.start_datetime).toLocaleDateString()}</p>
                  <p>{`${new Date(reservation.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      ${new Date(reservation.end_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</p>
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
        ))}
        {activeReservations.length > 3 && (
          <button
            className="ver-mais"
            onClick={() => setMostrarTodosAgendamentos(!mostrarTodosAgendamentos)}
          >
            {mostrarTodosAgendamentos ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
      </>
    );
  };

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
      <p>{message}</p>
    </div>
  );

  const validateTimeRange = () => {
    if (!timeRange.start || !timeRange.end) return false;
    
    const [startHour] = timeRange.start.split(':').map(Number);
    const [endHour] = timeRange.end.split(':').map(Number);
    
    return startHour >= 7 && endHour <= 22 && timeRange.start < timeRange.end;
  };

  // Atualizar a função handleDateSelect (ou criar se não existir)
  const handleDateSelect = (date: Date) => {
    // Verificar se a data está no passado
    if (date < new Date()) {
      return;
    }

    // Verificar se a data está marcada como ocupada
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayStatus = dayStatuses.find(d => d.date === dateStr);
    
    if (dayStatus?.status === 'ocupado') {
      // Se estiver ocupada, não permite a seleção
      return;
    }

    // Se estiver disponível, permite a seleção
    setSelectedDate({
      date,
      isAvailable: true
    });
  };

  // Adicione esta nova função para resetar os estados
  const resetAgendamento = () => {
    setSelectedValues({
      campus: '',
      andar: '',
      sala: ''
    });
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
      observacao: ''
    });
    setAgendamentoStep('campus');
    setShowNovoAgendamento(false);
  };

  // Adicione esta função helper
  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatUsername = (username: string) => {
    return username
      .split(/[.,@]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  // Funções para cancelamento
  const handleCancelClick = (reservationId: number) => {
    setReservationToCancel(reservationId);
    setShowCancelConfirmation(true);
  };

  const handleCancelConfirm = async () => {
    if (reservationToCancel) {
      try {
        const result = await cancelReservation(reservationToCancel);
        
        if (result.ok) {
          // Atualizar lista de reservas excluindo a cancelada
          const updatedReservations = await getUserReservations();
          setReservations(updatedReservations);
          
          // Fechar o popup
          setShowCancelConfirmation(false);
          setReservationToCancel(null);
        } else {
          setError('Não foi possível cancelar a reserva');
        }
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        setError('Erro ao cancelar reserva');
      }
    }
  };

  const handleCancelClose = () => {
    setShowCancelConfirmation(false);
    setReservationToCancel(null);
  };

  // Adicione a função de logout
  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout/');
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="agendamento-container">
      <header className="header">
        <div className="blue-bar">
          <div className="blue-bar-content">
            <button className="logout-button" onClick={handleLogout}>
              <img src={LogoutIcon} alt="Sair" />
            </button>
          </div>
        </div>
        <div className="white-bar">
          <img src={logoImg} alt="CESMAC" className="logo" />
        </div>
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
          ) : reservations.length === 0 ? (
            <p>Nenhum agendamento encontrado.</p>
          ) : (
            <>
              <div className="agendamentos-list">
                {reservations
                  .slice(0, mostrarTodosAgendamentos ? undefined : 2)
                  .map(reservation => (
                    <div key={reservation.id} className="agendamento-card">
                      <div className="card-content">
                        <div className="card-left">
                          <div className="building-icon">
                            <img src={Campusico} alt="Campus" className="campus-icon" />
                            <span className="campus-name">{reservation.building_name}</span>
                          </div>
                        </div>
                        <div className="card-right">
                          <div className="header-buttons">
                            <button className="edit-button" onClick={() => handleEdit(reservation)}>Editar</button>
                            <button className="cancel-button-small" onClick={() => handleCancelClick(reservation.id)}>Cancelar</button>
                          </div>
                          <div className="local-details">
                            <h3>{reservation.space_name}</h3>
                          </div>
                          <div className="agendamento-info">
                            <p>{new Date(reservation.start_datetime).toLocaleDateString()}</p>
                            <p>{`${new Date(reservation.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                ${new Date(reservation.end_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}</p>
                            <p className={`status ${reservation.status}`}>
                              {getStatusText(reservation.status)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
              .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime())
              .slice(0, mostrarTodoHistorico ? undefined : 2)
              .map(reservation => (
                <div key={reservation.id} className={`historico-card ${mapStatusToClassName(reservation.status)}`}>
                  <div className="historico-tags">
                    <span className={`tag tag-status ${mapStatusToClassName(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                    <span className="tag tag-time">
                      {`${new Date(reservation.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                       ${new Date(reservation.end_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    </span>
                    <span className="tag tag-date">
                      {new Date(reservation.start_datetime).toLocaleDateString()}
                    </span>
                    <span className="tag tag-people">
                      {`${reservation.capacity} pessoas`}
                    </span>
                  </div>
                  <div className="historico-location">
                    <div className="location-row">
                      <img src={Campusico} alt="Campus" className="location-icon" />
                      <span className="location-name">{reservation.space_name}</span>
                    </div>
                    <div className="location-row">
                      <img src={PingIcon} alt="Location" className="location-icon" />
                      <span className="location-campus">{reservation.building_name}</span>
                    </div>
                  </div>
                </div>
              ))}
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
                        onChange={(e) => setSelectedValues({
                          ...selectedValues,
                          sala: e.target.value
                        })}
                        disabled={!selectedValues.andar}
                      >
                        <option value="">Escolher Sala</option>
                        {spaces.map(space => (
                          <option key={space.id} value={space.name}>
                            {extractRoomName(space.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                        onChange={(date: Date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const status = dayStatuses.find(d => d.date === dateStr)?.status;
                          
                          setSelectedDate({ 
                            date, 
                            isAvailable: status === 'disponivel' 
                          });
                        }}
                        inline
                        locale={ptBR}
                        minDate={new Date()}
                        showMonthYearPicker={false}
                        monthsShown={1}
                        fixedHeight
                        openToDate={currentDate}
                        onSelect={handleDateSelect}
                        filterDate={(date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const dayStatus = dayStatuses.find(d => d.date === dateStr);
                          // Retorna true apenas para datas disponíveis ou que ainda não foram verificadas
                          return dayStatus?.status !== 'ocupado';
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
                                <span className="legend-dot selecionado"></span>
                                <span>Selecionado</span>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  <button 
                    className="back-button" 
                    onClick={handleBackStep}
                    disabled={agendamentoStep === 'campus'}
                  >
                    <img src={RightArrowIcon} alt="Voltar" className="back-icon" />
                  </button>
                  <button 
                    className="search-button" 
                    onClick={handleNextStep}
                    disabled={!canProceedToNext()}
                  >
                    <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
                  </button>
                </div>
              </>
            ) : agendamentoStep === 'confirmacao' ? (
              <div className="confirmacao-agendamento">
                <div className="selected-details">
                  <div className="detail-chip-location">
                    <img src={Campusico} alt="Campus" />
                    <span>{bookingDetails.campus}</span>
                  </div>
                  <div className="detail-chip-location">
                    <img src={PingIcon} alt="Location" />
                    <span>{bookingDetails.sala}</span>
                  </div>
                  <div className="detail-chip-time">
                    <img src={Calendario} alt="Data" />
                    <span>{bookingDetails.data}</span>
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
                      placeholder="Contato"
                      value={bookingDetails.telefone}
                      onChange={(e) => setBookingDetails({
                        ...bookingDetails,
                        telefone: e.target.value
                      })}
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
              <div className="resumo-agendamento">
                <h2>Resumo</h2>
                
                <div className="resumo-content">
                  <div className="resumo-group">
                    <div className="resumo-item">
                      <span className="label">Campus:</span>
                      <span className="value">{bookingDetails.campus}</span>
                    </div>
                    <div className="resumo-item">
                      <span className="label">Sala:</span>
                      <span className="value">{extractRoomName(bookingDetails.sala)}</span>
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
              <div className="sucesso-agendamento">
                <h3>Tudo pronto!</h3>
                
                <div className="sucesso-content">
                  <img src={BigCheckIcon} alt="Sucesso" className="big-check-icon" />
                  <p className="sucesso-message">Seu pedido de agendamento será analisado!</p>
                  <p className="sucesso-submessage">Mandaremos uma mensagem para te avisar da sua reserva</p>
                </div>

                <button 
                  className="conclude-button"
                  onClick={resetAgendamento}
                >
                  Concluir
                </button>
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