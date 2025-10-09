import { useState, useEffect } from 'react';
import { Calendar, Play, Square, Trophy, TrendingUp, Users, Banknote, RefreshCw } from 'lucide-react';
import { lotteryEventService } from '../services/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [winningNumber, setWinningNumber] = useState('');
  const [eventStats, setEventStats] = useState(null);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  // Cargar eventos del día seleccionado
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await lotteryEventService.getAll({ date: selectedDate });
      
      // Adaptarse a la respuesta real del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const eventData = response.data.detail || response.data.data || [];
        setEvents(eventData);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Generar eventos del día
  const handleGenerateEvents = async () => {
    if (!confirm('¿Está seguro de generar los eventos para el día seleccionado?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await lotteryEventService.generateDaily(selectedDate);
      
      if (response.data.codeStatus === 201 || response.data.responseStatus === 0) {
        alert('Eventos generados exitosamente');
        loadEvents();
      }
    } catch (err) {
      console.error('Error generating events:', err);
      setError(err.response?.data?.message || 'Error al generar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Abrir evento
  const handleOpenEvent = async (eventId) => {
    if (!confirm('¿Está seguro de abrir este evento para recibir apuestas?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await lotteryEventService.openEvent(eventId);
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        alert('Evento abierto exitosamente');
        loadEvents();
      }
    } catch (err) {
      console.error('Error opening event:', err);
      alert(err.response?.data?.message || 'Error al abrir evento');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar evento
  const handleCloseEvent = async (eventId) => {
    if (!confirm('¿Está seguro de cerrar este evento? No se podrán recibir más apuestas.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await lotteryEventService.closeEvent(eventId);
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        alert('Evento cerrado exitosamente');
        loadEvents();
      }
    } catch (err) {
      console.error('Error closing event:', err);
      alert(err.response?.data?.message || 'Error al cerrar evento');
    } finally {
      setLoading(false);
    }
  };

  // Publicar resultados
  const handlePublishResults = async (e) => {
    e.preventDefault();
    
    const number = parseInt(winningNumber);
    if (isNaN(number) || number < 0 || number > 99) {
      alert('El número ganador debe estar entre 00 y 99');
      return;
    }

    try {
      setLoading(true);
      const response = await lotteryEventService.publishResults(selectedEvent.id, {
        winningNumber: number
      });
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        alert('Resultados publicados exitosamente');
        setShowResultModal(false);
        setWinningNumber('');
        setSelectedEvent(null);
        loadEvents();
      }
    } catch (err) {
      console.error('Error publishing results:', err);
      alert(err.response?.data?.message || 'Error al publicar resultados');
    } finally {
      setLoading(false);
    }
  };

  // Ver estadísticas del evento
  const handleViewStats = async (event) => {
    try {
      setLoading(true);
      const response = await lotteryEventService.getStats(event.id);
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const stats = response.data.detail || response.data.data;
        setEventStats(stats);
        setSelectedEvent(event);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      alert('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Ver ganadores del evento
  const handleViewWinners = async (event) => {
    try {
      setLoading(true);
      const response = await lotteryEventService.getWinners(event.id);
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const winnersData = response.data.detail || response.data.data || [];
        setWinners(winnersData);
        setSelectedEvent(event);
        setShowWinnersModal(true);
      }
    } catch (err) {
      console.error('Error loading winners:', err);
      alert('Error al cargar ganadores: ' + (err.response?.data?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Obtener color del estado
  const getStateColor = (state) => {
    // Convertir número a string si es necesario
    const stateNum = typeof state === 'number' ? state : state;
    const stateMap = {
      0: 'PENDING',
      1: 'OPEN', 
      2: 'CLOSED',
      3: 'COMPLETED'
    };
    const stateName = typeof state === 'number' ? stateMap[state] : state;
    
    switch (stateName) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStateText = (state) => {
    const stateMap = {
      0: 'PENDING',
      1: 'OPEN',
      2: 'CLOSED', 
      3: 'COMPLETED'
    };
    const stateName = typeof state === 'number' ? stateMap[state] : state;
    
    switch (stateName) {
      case 'PENDING':
        return 'Pendiente';
      case 'OPEN':
        return 'Abierto';
      case 'CLOSED':
        return 'Cerrado';
      case 'COMPLETED':
        return 'Completado';
      default:
        return stateName;
    }
  };

  // Normalizar estado a string
  const normalizeState = (state) => {
    const stateMap = {
      0: 'PENDING',
      1: 'OPEN',
      2: 'CLOSED',
      3: 'COMPLETED'
    };
    return typeof state === 'number' ? stateMap[state] : state;
  };

  const EventCard = ({ event }) => {
    // Mapeo temporal de tipos de lotería (deberías obtener esto del backend)
    const lotteryTypeNames = {
      1: 'La Santa',
      2: 'La Rifa', 
      3: 'El Sorteo'
    };

    const payoutFactors = {
      1: 25.00,
      2: 70.00,
      3: 150.00
    };

    const eventState = normalizeState(event.state);

    return (
      <div className="bg-white border-l-4 border-green-500 rounded-r-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold text-gray-900">
                {event.lotteryTypeName || lotteryTypeNames[event.lotteryTypeId] || `Lotería ${event.lotteryTypeId}`}
              </h4>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStateColor(event.state)}`}>
                {getStateText(event.state)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Sorteo #{event.sequenceNumber || event.eventNumberOfDay} - {event.openTime} a {event.closeTime}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Paga: Q{(event.payoutFactor || payoutFactors[event.lotteryTypeId] || 0).toFixed(2)} por Q1
            </p>
          </div>
        </div>

        {event.winningNumber !== null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Número Ganador:</p>
            <p className="text-3xl font-bold text-yellow-600 text-center">
              {String(event.winningNumber).padStart(2, '0')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {eventState === 'PENDING' && (
            <button
              onClick={() => handleOpenEvent(event.id)}
              className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              <Play className="w-4 h-4" />
              <span>Abrir</span>
            </button>
          )}

          {eventState === 'OPEN' && (
            <button
              onClick={() => handleCloseEvent(event.id)}
              className="flex-1 flex items-center justify-center space-x-1 bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 text-sm"
            >
              <Square className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          )}

          {eventState === 'CLOSED' && event.winningNumber === null && (
            <button
              onClick={() => {
                setSelectedEvent(event);
                setShowResultModal(true);
              }}
              className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>Publicar Resultado</span>
            </button>
          )}

          {eventState === 'COMPLETED' && (
            <button
              onClick={() => handleViewWinners(event)}
              className="flex-1 flex items-center justify-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>Ver Ganadores</span>
            </button>
          )}

          <button
            onClick={() => handleViewStats(event)}
            className="flex items-center justify-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Stats</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h2>
          <p className="text-gray-600">Administra los sorteos del día</p>
        </div>
        <button
          onClick={loadEvents}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Controles de Fecha */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Evento
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateEvents}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Generar Eventos del Día
          </button>
        </div>
      </div>

      {/* Lista de Eventos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando eventos...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg mb-4">
            No hay eventos para el día seleccionado
          </p>
          <button
            onClick={handleGenerateEvents}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Generar Eventos Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Modal de Publicar Resultados */}
      {showResultModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Publicar Resultado</h3>
            
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sorteo:</p>
              <p className="font-bold text-lg">{selectedEvent.lotteryTypeName}</p>
              <p className="text-sm text-gray-600">Evento #{selectedEvent.sequenceNumber}</p>
            </div>

            <form onSubmit={handlePublishResults} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número Ganador (00-99)
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={winningNumber}
                  onChange={(e) => setWinningNumber(e.target.value)}
                  placeholder="Ingrese el número ganador"
                  required
                  className="w-full px-4 py-3 text-3xl font-bold text-center border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Una vez publicado el resultado, no se puede modificar y se procesarán automáticamente los ganadores.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResultModal(false);
                    setWinningNumber('');
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Estadísticas */}
      {eventStats && selectedEvent && !showResultModal && !showWinnersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Estadísticas del Evento</h3>
            
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-bold text-lg">{selectedEvent.lotteryTypeName}</p>
              <p className="text-sm text-gray-600">
                Evento #{selectedEvent.sequenceNumber} - {selectedEvent.openTime} a {selectedEvent.closeTime}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{eventStats.totalBets || 0}</p>
                <p className="text-sm text-gray-600">Apuestas</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <Banknote className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  Q{(eventStats.totalRevenue || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Ingresos</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {eventStats.uniqueCustomers || 0}
                </p>
                <p className="text-sm text-gray-600">Clientes</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-600">
                  {eventStats.totalWinners || 0}
                </p>
                <p className="text-sm text-gray-600">Ganadores</p>
              </div>
            </div>

            {eventStats.numberDistribution && eventStats.numberDistribution.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Números Más Apostados:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {eventStats.numberDistribution.slice(0, 10).map((item) => (
                    <div key={item.number} className="bg-gray-50 p-2 rounded text-center">
                      <p className="font-bold text-lg">{String(item.number).padStart(2, '0')}</p>
                      <p className="text-xs text-gray-600">{item.count} apuestas</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setEventStats(null);
                setSelectedEvent(null);
              }}
              className="w-full mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ganadores */}
      {showWinnersModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                Ganadores del Sorteo
              </h3>
              <button
                onClick={() => {
                  setShowWinnersModal(false);
                  setWinners([]);
                  setSelectedEvent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Info del evento */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {selectedEvent.lotteryTypeName || `Lotería ${selectedEvent.lotteryTypeId}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sorteo #{selectedEvent.sequenceNumber || selectedEvent.eventNumberOfDay} - {selectedEvent.eventDate}
                  </p>
                </div>
                {selectedEvent.winningNumber !== null && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg px-6 py-3">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">Número Ganador</p>
                    <p className="text-4xl font-bold text-yellow-600">
                      {String(selectedEvent.winningNumber).padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de ganadores */}
            {winners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-600 mb-2">Ganador Desierto</h4>
                <p className="text-gray-500">No hubo ganadores en este sorteo</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">
                    Total de ganadores: <span className="text-green-600">{winners.length}</span>
                  </h4>
                  <p className="text-sm text-gray-500">
                    Premio total: <span className="font-bold text-green-600">
                      Q{winners.reduce((sum, w) => sum + w.totalPrize, 0).toFixed(2)}
                    </span>
                  </p>
                </div>

                {winners.map((winner, index) => (
                  <div
                    key={winner.betId}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900">{winner.customerName}</p>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>Número apostado: <span className="font-semibold text-green-600">
                              {String(winner.chosenNumber).padStart(2, '0')}
                            </span></span>
                            <span>•</span>
                            <span>Apuesta: <span className="font-semibold">Q{winner.betAmount.toFixed(2)}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          Q{winner.totalPrize.toFixed(2)}
                        </p>
                        {winner.isBirthday && winner.birthdayBonus > 0 && (
                          <p className="text-xs text-yellow-600 font-semibold flex items-center justify-end">
                            🎂 +Q{winner.birthdayBonus.toFixed(2)} cumpleaños
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Base: Q{winner.basePrize.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowWinnersModal(false);
                  setWinners([]);
                  setSelectedEvent(null);
                }}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;