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

interface Agendamento {
  id: number;
  local: string;
  campus: string;
  data: string;
  horario: string;
  pessoas: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';  // Changed 'realizado' to 'concluido'
}

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
type AgendamentoStep = 'campus' | 'andar' | 'sala' | 'confirmacao';

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

export const Agendamento = (): JSX.Element => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [historico, setHistorico] = useState<Agendamento[]>([]);
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

  // Simular dados - substituir por chamada API real
  useEffect(() => {
    // Dados simulados
    const mockAgendamentos: Agendamento[] = [
      {
        id: 1,
        local: 'Sala Invertida 1',
        campus: 'Campus 1',
        data: '11/08/2025',
        horario: '08:00',
        pessoas: '080',
        status: 'pendente'
      },
      {
        id: 2,
        local: 'Laboratório 1',
        campus: 'Campus 1',
        data: '15/08/2025',
        horario: '10:00 ',
        pessoas: '020',
        status: 'confirmado'
      },
      {
        id: 3,
        local: 'Sala Invertida 1',
        campus: 'Campus 1',
        data: '11/08/2025',
        horario: '08:00 ',
        pessoas: '080',
        status: 'pendente'
      },
      {
        id: 4,
        local: 'Sala invertida 1',
        campus: 'Campus 1',
        data: '15/04/2025',
        horario: '18:00',
        pessoas: '50',
        status: 'concluido'
      },
      {
        id: 5,
        local: 'Sala invertida 1',
        campus: 'Campus 1',
        data: '15/04/2025',
        horario: '18:00',
        pessoas: '50',
        status: 'cancelado'
      },
      {
        id: 6,
        local: 'Sala invertida 1',
        campus: 'Campus 1',
        data: '15/04/2025',
        horario: '18:00',
        pessoas: '50',
        status: 'pendente'
      },
      {
        id: 7,
        local: 'Sala invertida 1',
        campus: 'Campus 1',
        data: '15/04/2025',
        horario: '18:00',
        pessoas: '50',
        status: 'confirmado'
      },
      {
        id: 8,
        local: 'Sala invertida 1',
        campus: 'Campus 1',
        data: '14/04/2025',
        horario: '14:00',
        pessoas: '45',
        status: 'concluido'
      },
      {
        id: 9,
        local: 'Laboratório 2',
        campus: 'Campus 2',
        data: '13/04/2025',
        horario: '16:00',
        pessoas: '30',
        status: 'cancelado'
      },
      {
        id: 10,
        local: 'Quadra',
        campus: 'Campus 4',
        data: '12/04/2025',
        horario: '10:00',
        pessoas: '60',
        status: 'pendente'
      }
    ];

    const agendamentosAtivos = mockAgendamentos.filter(
      a => a.status === 'pendente' || a.status === 'confirmado'
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    // Remova o filtro e mantenha apenas a ordenação por data
    const historicoAgendamentos = mockAgendamentos
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    setAgendamentos(agendamentosAtivos);
    setHistorico(historicoAgendamentos);
  }, []);

  // Update the add button click handler
  const handleAddClick = () => {
    setShowNovoAgendamento(true);
    setAgendamentoStep('campus');
    // Scroll to novo-agendamento section
    setTimeout(() => {
      novoAgendamentoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Add handler for next step
  const handleNextStep = () => {
    if (agendamentoStep === 'campus' && selectedValues.campus) {
      setAgendamentoStep('andar');
    } else if (agendamentoStep === 'andar' && selectedValues.andar && selectedValues.sala && timeRange.start && timeRange.end && selectedDate.date) {
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
    }
  };

  const handleBackStep = () => {
    if (agendamentoStep === 'sala') {
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

  return (
    <div className="agendamento-container">
      <header className="header">
        <div className="blue-bar">
        </div>
        <div className="white-bar">
          <img src={logoImg} alt="CESMAC" className="logo" />
        </div>
        <div className="user-bar">
          <img src={userImg} alt="Perfil" className="user-photo" />
          <div className="user-info">
            <span className="welcome">Bem-vindo!</span>
            <span className="username">Gabriela Saraiva</span>
          </div>
          <button className="add-button" onClick={handleAddClick}>
            <img src={PlusIcon} alt="Adicionar" className="plus-icon" />
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="proximos-agendamentos">
          <h2>Meus agendamentos</h2>
          <div className="agendamentos-list">
            {agendamentos
              .slice(0, mostrarTodosAgendamentos ? undefined : 2)
              .map(agendamento => (
                <div key={agendamento.id} className="agendamento-card">
                  <div className="card-content">
                    <div className="card-left">
                      <div className="building-icon">
                        <img src={Campusico} alt="Campus" className="campus-icon" />
                        <span className="campus-name">{agendamento.campus}</span>
                      </div>
                    </div>
                    <div className="card-right">
                      <div className="header-buttons">
                        <button className="edit-button">Editar</button>
                        <button className="cancel-button-small">Cancelar</button>
                      </div>
                      <div className="local-details">
                        <h3>{agendamento.local}</h3>
                      </div>
                      <div className="agendamento-info">
                        <p>{agendamento.data}</p>
                        <p>{agendamento.horario}</p>
                        <p>{agendamento.pessoas}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {agendamentos.length > 2 && (
            <button
              className="ver-mais"
              onClick={() => setMostrarTodosAgendamentos(!mostrarTodosAgendamentos)}
            >
              {mostrarTodosAgendamentos ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </section>

        <section className="historico">
          <h2>Histórico de agendamento</h2>
          <div className="historico-list">
            {historico
              .slice(0, mostrarTodoHistorico ? undefined : 2)
              .map(agendamento => (
                <div key={agendamento.id} className={`historico-card ${agendamento.status}`}>
                  <div className="historico-tags">
                    <span className={`tag tag-status ${agendamento.status}`}>
                      {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                    </span>
                    <span className="tag tag-time">{agendamento.horario}</span>
                    <span className="tag tag-date">{agendamento.data}</span>
                    <span className="tag tag-people">{agendamento.pessoas} Pessoas</span>
                  </div>
                  <div className="historico-location">
                    <div className="location-row">
                      <img src={Campusico} alt="Campus" className="location-icon" />
                      <span className="location-name">{agendamento.local}</span>
                    </div>
                    <div className="location-row">
                      <img src={PingIcon} alt="Location" className="location-icon" />
                      <span className="location-campus">{agendamento.campus}</span>
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
            <h2>Novo Agendamento</h2>
            {agendamentoStep === 'campus' ? (
              <div className="filtro">
                <label>{stepContents.campus.label}</label>
                <select 
                  value={selectedValues.campus} 
                  onChange={(e) => setSelectedValues({
                    ...selectedValues,
                    campus: e.target.value
                  })}
                >
                  <option value="" disabled>{stepContents.campus.placeholder}</option>
                  {stepContents.campus.options.map(option => (
                    <option key={option} value={option}>{option}</option>
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
                        andar: e.target.value
                      })}
                    >
                      <option value="" disabled>Escolher Andar</option>
                      {stepContents.details.sections[0].options.map(option => (
                        <option key={option} value={option}>{option}</option>
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
                    >
                      <option value="" disabled>Escolher Sala</option>
                      {stepContents.details.sections[1].options.map(option => (
                        <option key={option} value={option}>{option}</option>
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
            ) : (
              <div className="confirmacao-agendamento">
                <h2></h2>
                
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

                <div className="form-group">
                  <label>Telefone para contato</label>
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

                <div className="form-group">
                  <label>Observações da reserva (Opcional)</label>
                  <textarea
                    placeholder="Observação"
                    value={bookingDetails.observacao}
                    onChange={(e) => setBookingDetails({
                      ...bookingDetails,
                      observacao: e.target.value
                    })}
                  />
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
                    <img src={RightArrowIcon} alt="Confirmar" className="arrow-icon" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};