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
  cancelReservation 
} from '../../services/api';
import type { 
  Space, 
  Reservation, 
  StepContent, 
  Building,
  Floor 
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

  // Adicione o estado para selectedSpace
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  // Função para verificar disponibilidade de um dia específico
  const checkDayAvailability = async (date: Date) => {
    if (!selectedValues.sala || !timeRange.start || !timeRange.end) {
      return 'disponivel';
    }

    const currentSpace = selectedSpace;
    if (!currentSpace) {
      console.error('Nenhum espaço selecionado');
      return 'disponivel';
    }

    try {
      const availabilityResponse = await api.get(`/api/spaces/${currentSpace.id}/availability/`, {
        params: {
          start_time: format(date, "yyyy-MM-dd'T'" + timeRange.start + ':00'),
          end_time: format(date, "yyyy-MM-dd'T'" + timeRange.end + ':00')
        }
      });

      return availabilityResponse.data.is_available ? 'disponivel' : 'ocupado';
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return 'ocupado';
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

  // Atualize a função handleNextStep
  const handleNextStep = async () => {
    if (agendamentoStep === 'andar' && !canProceedToNext()) {
      setError('Preencha todos os campos');
      return;
    }
    
    if (agendamentoStep === 'andar') {
      if (canProceedToNext() && selectedDate.date) {
        setBookingDetails({
          ...bookingDetails,
          campus: selectedValues.campus,
          andar: selectedValues.andar,
          sala: selectedValues.sala,
          data: selectedDate.date.toLocaleDateString(),
          horario: {
            inicio: timeRange.start,
            fim: timeRange.end
          }
        });
        setAgendamentoStep('confirmacao');
      }
      return;
    }

    if (agendamentoStep === 'confirmacao') {
      if (bookingDetails.curso && bookingDetails.telefone) {
        setAgendamentoStep('resumo');
      } else {
        setError('Preencha todos os campos obrigatórios');
      }
      return;
    }
    
    if (agendamentoStep === 'resumo') {
      try {
        // Create a new dummy reservation
        const newReservation: Reservation = {
          id: Date.now(), // Use timestamp as temporary ID
          title: bookingDetails.curso,
          description: bookingDetails.observacao || '',
          space: 1,
          space_name: bookingDetails.sala,
          building: 1,
          building_name: bookingDetails.campus,
          floor_name: bookingDetails.andar,
          start_datetime: new Date(
            selectedDate.date!.setHours(
              parseInt(bookingDetails.horario.inicio.split(':')[0]),
              parseInt(bookingDetails.horario.inicio.split(':')[1])
            )
          ).toISOString(),
          end_datetime: new Date(
            selectedDate.date!.setHours(
              parseInt(bookingDetails.horario.fim.split(':')[0]),
              parseInt(bookingDetails.horario.fim.split(':')[1])
            )
          ).toISOString(),
          status: 'pending',
          user_email: userProfile?.email || '',
          capacity: 30
        };

        // Add the new reservation to both lists
        setReservations(prev => [...prev, newReservation]);
        setHistorico(prev => [...prev, newReservation]);
        
        // Move to success step
        setAgendamentoStep('sucesso');
      } catch (error) {
        console.error('Erro:', error);
        setError('Erro ao criar agendamento. Tente novamente.');
      }
    } else if (agendamentoStep === 'campus') {
      setAgendamentoStep('andar');
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
      observacao: ''
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
                  .filter(res => res.status !== 'canceled' && res.status !== 'completed')
                  .slice(0, mostrarTodosAgendamentos ? undefined : 2)
                  .map(reservation => (
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
                <div key={reservation.id} className={`historico-card ${mapStatusToClassName(reservation.status)} ${!showNovoAgendamento ? 'full-width' : ''}`}>
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
                        onChange={(date: Date | null) => {
                          if (date) {
                            handleDateSelect(date);
                          }
                        }}
                        onSelect={handleDateSelect}
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
                    disabled={agendamentoStep === 'campus' as AgendamentoStep}
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