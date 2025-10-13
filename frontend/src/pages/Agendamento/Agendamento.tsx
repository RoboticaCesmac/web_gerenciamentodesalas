import React, { useState, useEffect, useRef } from 'react';
import './Agendamento.css';
import logoImg from '../../assets/logo-CESMAC-redux.svg'; // ajuste o caminho se necessário
import Campusico from '../../assets/Campus-ico.svg';
import userImg from '../../assets/Icones-Perfil.svg'; // adicione uma imagem de perfil padrão
import PingIcon from '../../assets/ping.svg'; // Importe o ícone de localização
import PlusIcon from '../../assets/Plus.svg';
import RightArrowIcon from '../../assets/Right-Arrow.svg';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import Calendario from '../../assets/Calendario.svg';
import ChapeuIcon from '../../assets/chapeu.svg';
import TelefoneIcon from '../../assets/telefone.svg';
import MensagemIcon from '../../assets/Icones-Mensagem.svg';
import CheckIcon from '../../assets/check.svg'; // Importe o ícone de confirmação
import BigCheckIcon from '../../assets/Big-Check.svg';
import { getUserProfile, getBuildings, getFloorsByBuilding, getSpacesByFloor, getUserReservations, createReservation } from '../../services/api';

// Update the interface to include step options
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

// Add this before the component
const stepContents: Record<string, StepContent> = {
  campus: {
    title: 'Campus',
    label: 'Campus',
    placeholder: 'Escolher Campus',
    options: ['Campus 1', 'Campus 2', 'Campus 3', 'Campus 4']
  },
  details: {
    title: 'Novo Agendamento',
    sections: [
      {
        label: 'Andar',
        placeholder: 'Escolher Andar',
        options: ['1º Andar', '2º Andar', '3º Andar', '4º Andar']
      },
      {
        label: 'Sala',
        placeholder: 'Escolher Sala',
        options: ['Sala 101', 'Sala 102', 'Sala 103', 'Laboratório 1']
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

// Add this interface for unavailable times
interface UnavailableTime {
  date: string;
  times: string[];
}

// Add mock unavailable times
const unavailableTimes: UnavailableTime[] = [
  {
    date: '2025-08-05',
    times: ['10:00-12:00', '14:00-16:00']
  },
  {
    date: '2025-08-06',
    times: ['08:00-10:00']
  }
];

// Add this interface for day status
interface DayStatus {
  date: string; // format: 'YYYY-MM-DD'
  status: 'disponivel' | 'ocupado' | 'selecionado';
}

// Add mock data for day statuses (you should replace this with your API data)
const mockDayStatuses: DayStatus[] = [
  { date: '2025-10-12', status: 'disponivel' },
  { date: '2025-10-14', status: 'ocupado' },
  { date: '2025-10-19', status: 'ocupado' },
  { date: '2025-10-25', status: 'ocupado' },
];

// Update the step type
type AgendamentoStep = 'campus' | 'andar' | 'sala' | 'confirmacao' | 'resumo' | 'sucesso';

// Add new interface for booking details
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
  space_name: string;
  building_name: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  user_email: string;
  capacity: number; // Adicione este campo
}

// Adicione estas interfaces no início do arquivo, após as existentes
interface Building {
  id: number;
  name: string;
}

interface Floor {
  id: number;
  name: string;
}

interface Space {
  id: number;
  name: string;
}

export const Agendamento = (): JSX.Element => {
  // Adicione estes estados
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  
  // Add new states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [historico, setHistorico] = useState<Reservation[]>([]); // Primeiro, adicione o estado para histórico
  const [mostrarTodosAgendamentos, setMostrarTodosAgendamentos] = useState(false);
  const [mostrarTodoHistorico, setMostrarTodoHistorico] = useState(false);
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false); // Add new state for controlling visibility
  const [agendamentoStep, setAgendamentoStep] = useState<AgendamentoStep>('campus'); // Add new state for steps

  // Add ref for novo-agendamento section
  const novoAgendamentoRef = useRef<HTMLDivElement>(null);

  // Add this state for selected values
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

  // Update the useEffect that fetches data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        console.log('Profile data:', profile); // Add this log
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

  // Atualizar useEffect para carregar prédios
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const data = await getBuildings();
        console.log('Buildings received:', data); // Debug
        setBuildings(data);
      } catch (err) {
        console.error('Erro ao carregar prédios:', err);
      }
    };

    fetchBuildings();
  }, []);

  // Modifique o useEffect para carregar andares quando um campus é selecionado
  useEffect(() => {
    const fetchFloors = async () => {
      if (selectedValues.campus) {
        const building = buildings.find(b => b.name === selectedValues.campus);
        console.log('Selected building:', building); // Debug
        if (building?.id) {
          try {
            const data = await getFloorsByBuilding(building.id);
            console.log('Floors received:', data); // Debug
            setFloors(data);
          } catch (err) {
            console.error('Erro ao carregar andares:', err);
          }
        }
      }
    };
    fetchFloors();
  }, [selectedValues.campus, buildings]);

  // Modifique o useEffect para carregar salas quando um andar é selecionado
  useEffect(() => {
    const fetchSpaces = async () => {
      if (selectedValues.andar) {
        const floor = floors.find(f => f.name === selectedValues.andar);
        console.log('Selected floor:', floor); // Debug
        if (floor?.id) {
          try {
            const data = await getSpacesByFloor(floor.id);
            console.log('Spaces received:', data); // Debug
            setSpaces(data);
          } catch (err) {
            console.error('Erro ao carregar salas:', err);
          }
        }
      }
    };
    fetchSpaces();
  }, [selectedValues.andar, floors]);

  // Atualizar os conteúdos dinâmicos do formulário
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

  // Update the add button click handler
  const handleAddClick = () => {
    setShowNovoAgendamento(true);
    setAgendamentoStep('campus');
    // Scroll to novo-agendamento section
    setTimeout(() => {
      novoAgendamentoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Update handleNextStep function
  const handleNextStep = async () => {
    if (agendamentoStep === 'campus' && selectedValues.campus) {
      setAgendamentoStep('andar');
    } else if (agendamentoStep === 'andar' && selectedValues.sala && timeRange.start && timeRange.end && selectedDate.date) {
      // Save the current selections before moving to confirmation
      setBookingDetails({
        ...bookingDetails,
        campus: selectedValues.campus,
        andar: selectedValues.andar,
        sala: selectedValues.sala,
        data: format(selectedDate.date, 'dd/MM/yyyy'),
        horario: {
          inicio: timeRange.start,
          fim: timeRange.end
        }
      });
      setAgendamentoStep('confirmacao');
    } else if (agendamentoStep === 'confirmacao' && bookingDetails.curso && bookingDetails.telefone) {
      setAgendamentoStep('resumo');
    } else if (agendamentoStep === 'resumo') {
      // Automatically go to sucesso step after resumo
      setAgendamentoStep('sucesso');
    } else if (agendamentoStep === 'sucesso') {
      try {
        const reservationData = {
          building: bookingDetails.campus,
          space: bookingDetails.sala,
          start_datetime: `${bookingDetails.data}T${bookingDetails.horario.inicio}`,
          end_datetime: `${bookingDetails.data}T${bookingDetails.horario.fim}`,
          title: bookingDetails.curso,
          description: bookingDetails.observacao || 'Sem observações',
        };

        await createReservation(reservationData);
        setAgendamentoStep('sucesso');
        
        // Refresh reservations list
        const newReservations = await getUserReservations();
        setUserReservations(newReservations);
      } catch (err) {
        setError('Erro ao criar agendamento');
        console.error(err);
      }
    }
  };

  // Update handleBackStep function
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

  // Add this before the component
  const isFirstMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Add this function inside your component
  const getDayClassName = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayStatus = mockDayStatuses.find(d => d.date === dateStr);
    return dayStatus?.status || 'ocupado'; // Default to ocupado if status is unknown
  };

  // Add this function to check if time and location are selected
  const isTimeAndLocationSelected = () => {
    return (
      selectedValues.andar !== '' &&
      selectedValues.sala !== '' &&
      timeRange.start !== '' &&
      timeRange.end !== ''
    );
  };

  // Inside your component, add new state:
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

  // Atualizar o useEffect que carrega os agendamentos
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userProfileData = await getUserProfile();
        const reservationsData = await getUserReservations();
        
        setUserProfile(userProfileData);
        setReservations(reservationsData);
        setHistorico(reservationsData); // O histórico agora usa os mesmos dados
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar agendamentos');
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Adicione esta função de mapeamento de status
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

  // E adicione esta nova função para traduzir o texto do status
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

  // Atualize a função renderAgendamentos
  const renderAgendamentos = () => {
    if (loading) return <p>Carregando...</p>;
    if (error) return <p>{error}</p>;
    if (reservations.length === 0) return <p>Nenhum agendamento encontrado.</p>;

    const reservationsToShow = mostrarTodosAgendamentos 
      ? reservations 
      : reservations.slice(0, 3);

    return (
      <>
        {reservationsToShow.map((reservation) => (
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
                  <button className="edit-button">Editar</button>
                  <button className="cancel-button-small">Cancelar</button>
                </div>
                <div className="local-details">
                  <h3>{reservation.space_name}</h3>
                </div>
                <div className="agendamento-info">
                  <p>{new Date(reservation.start_datetime).toLocaleDateString()}</p>
                  <p>{`${new Date(reservation.start_datetime).toLocaleTimeString()} - 
                      ${new Date(reservation.end_datetime).toLocaleTimeString()}`}</p>
                  <p className={`status ${mapStatusToClassName(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </p>
                  <p className="capacity">Pessoas: {reservation.capacity}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {reservations.length > 3 && (
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

  return (
    <div className="agendamento-container">
      <header className="header">
        <div className="blue-bar">
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
            <span className="username">
              {loading 
                ? 'Carregando...'
                : userProfile
                  ? userProfile.first_name 
                    ? `${userProfile.first_name.replace('.', ' ')} ${userProfile.last_name?.replace('.', ' ') || ''}`
                    : userProfile.username.replace('.', ' ')
                  : 'Usuário'
              }
            </span>
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
                            <button className="edit-button">Editar</button>
                            <button className="cancel-button-small">Cancelar</button>
                          </div>
                          <div className="local-details">
                            <h3>{reservation.space_name}</h3>
                          </div>
                          <div className="agendamento-info">
                            <p>{new Date(reservation.start_datetime).toLocaleDateString()}</p>
                            <p>{`${new Date(reservation.start_datetime).toLocaleTimeString()} - 
                                ${new Date(reservation.end_datetime).toLocaleTimeString()}`}</p>
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
              .slice(0, mostrarTodoHistorico ? undefined : 2)
              .map(reservation => (
                <div key={reservation.id} className={`historico-card ${mapStatusToClassName(reservation.status)}`}>
                  <div className="historico-tags">
                    <span className={`tag tag-status ${mapStatusToClassName(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </span>
                    <span className="tag tag-time">
                      {new Date(reservation.start_datetime).toLocaleTimeString()}
                    </span>
                    <span className="tag tag-date">
                      {new Date(reservation.start_datetime).toLocaleDateString()}
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
            {agendamentoStep === 'campus' ? (
              <div className="filtro">
                <label>{stepContentsDynamic.campus.label}</label>
                <select 
                  value={selectedValues.campus} 
                  onChange={(e) => setSelectedValues({
                    ...selectedValues,
                    campus: e.target.value,
                    andar: '', // Limpar seleções dependentes
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
                <button 
                  className="search-button" 
                  onClick={handleNextStep}
                  disabled={!selectedValues.campus}
                >
                  <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
                </button>
              </div>
            ) : agendamentoStep === 'andar' ? (
              
              <div className="agendamento-details">
                <div className="select-row">
                  <div className="select-group">
                    <label>Andar</label>
                    <select 
                      value={selectedValues.andar}
                      onChange={(e) => setSelectedValues({
                        ...selectedValues,
                        andar: e.target.value,
                        sala: '' // Limpar sala ao mudar andar
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
                          {space.name}
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

                {isTimeAndLocationSelected() && (
                  <div className="calendar-section">
                    <DatePicker
                      selected={selectedDate.date}
                      onChange={(date: Date) => setSelectedDate({ date, isAvailable: true })}
                      inline
                      locale={ptBR}
                      minDate={new Date()}
                      showMonthYearPicker={false}
                      monthsShown={1}
                      fixedHeight
                      openToDate={currentDate}
                      dayClassName={getDayClassName}
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
                    disabled={!selectedValues[agendamentoStep]}
                  >
                    <img src={RightArrowIcon} alt="Próximo" className="arrow-icon" />
                  </button>
                </div>
              </div>
            ) : agendamentoStep === 'confirmacao' ? (
              <div className="confirmacao-agendamento">
                <h2>Novo Agendamento</h2>
                
                <div className="selected-details">
                  <div className="detail-chip-location">
                    <img src={Campusico} alt="Campus" />
                    <span>{bookingDetails.campus}</span>
                  </div>
                  <div className="detail-chip-location">
                    <img src={PingIcon} alt="Location" />
                    <span>{`${bookingDetails.sala}`}</span>
                  </div>
                  <div className="detail-chip-time">
                    <img src={Calendario} alt="Data" />
                    <span>{`${bookingDetails.data} ${bookingDetails.horario.inicio} às ${bookingDetails.horario.fim}`}</span>
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
                <h2>Novo Agendamento</h2>
                <h3>Resumo</h3>
                
                <div className="resumo-content">
                  <div className="resumo-group">
                    <div className="resumo-item">
                      <span className="label">Campus:</span>
                      <span className="value">{bookingDetails.campus}</span>
                    </div>
                    <div className="resumo-item">
                      <span className="label">Sala:</span>
                      <span className="value">{bookingDetails.sala}</span>
                    </div>
                  </div>

                  <div className="resumo-group">
                    <div className="resumo-item">
                      <span className="label">Data:</span>
                      <span className="value">{bookingDetails.data}</span>
                    </div>
                    <div className="resumo-item">
                      <span className="label">Horário:</span>
                      <span className="value">{`${bookingDetails.horario.inicio} às ${bookingDetails.horario.fim}`}</span>
                    </div>
                  </div>

                  <div className="resumo-group">
                    <div className="resumo-item">
                      <span className="label">Curso:</span>
                      <span className="value">{bookingDetails.curso}</span>
                    </div>
                    <div className="resumo-item">
                      <span className="label">Contato:</span>
                      <span className="value">{bookingDetails.telefone}</span>
                    </div>
                  </div>

                  {bookingDetails.observacao && (
                    <div className="resumo-group">
                      <div className="resumo-item">
                        <span className="label">Obs:</span>
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
                <h2>Novo Agendamento</h2>
                <h3>Tudo pronto!</h3>
                
                <div className="sucesso-content">
                  <img src={BigCheckIcon} alt="Sucesso" className="big-check-icon" />
                  <p className="sucesso-message">Seu pedido de agendamento será analisado!</p>
                  <p className="sucesso-submessage">Mandaremos uma mensagem para te avisar da sua reserva</p>
                </div>

                <button className="concluir-button" onClick={() => setShowNovoAgendamento(false)}>
                  <img src={CheckIcon} alt="Confirmar" />
                  <span>Concluir</span>
                </button>
              </div>
            ) : null}
          </section>
        )}
        
      </main>
    </div>
  );
};