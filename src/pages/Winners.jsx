import { useState, useEffect } from 'react';
import { Trophy, Calendar, Filter, Banknote, CheckCircle, Clock, XCircle, Gift, AlertTriangle } from 'lucide-react';
import { lotteryEventService } from '../services/api';

function Winners() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [winners, setWinners] = useState([]);
  const [emptyEvents, setEmptyEvents] = useState([]); // ✅ Eventos sin ganadores
  const [selectedLotteryType, setSelectedLotteryType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    expired: 0,
    totalAmount: 0,
    paidAmount: 0,
    emptyEvents: 0, // ✅ Contador de eventos desiertos
  });

  useEffect(() => {
    loadWinners();
  }, [selectedDate]);

  const loadWinners = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los eventos COMPLETADOS del día
      const eventsResponse = await lotteryEventService.getAll({ 
        date: selectedDate,
        state: 3 // RESULTS_PUBLISHED
      });

      if (eventsResponse.data.codeStatus === 200 || eventsResponse.data.responseStatus === 0) {
        const events = eventsResponse.data.detail || eventsResponse.data.data || [];
        
        // Obtener ganadores de cada evento
        let allWinners = [];
        let eventsWithoutWinners = []; // ✅ Lista de eventos sin ganadores
        
        for (const event of events) {
          try {
            const winnersResponse = await lotteryEventService.getWinners(event.id);
            
            if (winnersResponse.data.codeStatus === 200 || winnersResponse.data.responseStatus === 0) {
              const eventWinners = winnersResponse.data.detail || winnersResponse.data.data || [];
              
              // ✅ Si no hay ganadores, agregarlo a la lista de eventos desiertos
              if (eventWinners.length === 0) {
                eventsWithoutWinners.push({
                  eventId: event.id,
                  lotteryTypeId: event.lotteryTypeId,
                  lotteryTypeName: getLotteryTypeName(event.lotteryTypeId),
                  eventDate: event.eventDate,
                  eventNumber: event.eventNumberOfDay,
                  winningNumber: event.winningNumber,
                  isEmpty: true
                });
              } else {
                // Agregar información del evento a cada ganador
                const winnersWithEvent = eventWinners.map(w => ({
                  ...w,
                  lotteryTypeId: event.lotteryTypeId,
                  lotteryTypeName: getLotteryTypeName(event.lotteryTypeId),
                  eventDate: event.eventDate,
                  eventNumber: event.eventNumberOfDay,
                  eventWinningNumber: event.winningNumber
                }));
                
                allWinners = [...allWinners, ...winnersWithEvent];
              }
            }
          } catch (err) {
            console.error(`Error loading winners for event ${event.id}:`, err);
            // Si hay error, también considerar el evento como desierto
            eventsWithoutWinners.push({
              eventId: event.id,
              lotteryTypeId: event.lotteryTypeId,
              lotteryTypeName: getLotteryTypeName(event.lotteryTypeId),
              eventDate: event.eventDate,
              eventNumber: event.eventNumberOfDay,
              winningNumber: event.winningNumber,
              isEmpty: true,
              error: true
            });
          }
        }
        
        setWinners(allWinners);
        setEmptyEvents(eventsWithoutWinners);
        
        // Calcular estadísticas
        calculateStats(allWinners, eventsWithoutWinners);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setWinners([]);
      setEmptyEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getLotteryTypeName = (typeId) => {
    const types = {
      1: 'La Santa',
      2: 'La Rifa',
      3: 'El Sorteo'
    };
    return types[typeId] || `Tipo ${typeId}`;
  };

  const calculateStats = (winnersData, emptyEventsData) => {
    let pending = 0;
    let paid = 0;
    let expired = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    
    winnersData.forEach(winner => {
      const status = getWinnerStatus(winner);
      if (status === 'PENDING') pending++;
      else if (status === 'PAID') {
        paid++;
        paidAmount += winner.totalPrize || 0;
      }
      else if (status === 'EXPIRED') expired++;
      
      totalAmount += winner.totalPrize || 0;
    });
    
    setStats({
      total: winnersData.length,
      pending,
      paid,
      expired,
      totalAmount,
      paidAmount,
      emptyEvents: emptyEventsData.length
    });
  };

  const getWinnerStatus = (winner) => {
    // Aquí debes implementar la lógica para determinar el estado
    // basado en la estructura de datos de tu backend
    if (winner.state === 2 || winner.state === 'PAID') return 'PAID';
    if (winner.state === 3 || winner.state === 'EXPIRED') return 'EXPIRED';
    return 'PENDING';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: CheckCircle,
          label: 'Pagado'
        };
      case 'PENDING':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: Clock,
          label: 'Pendiente'
        };
      case 'EXPIRED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: XCircle,
          label: 'Expirado'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Clock,
          label: status
        };
    }
  };

  const filteredWinners = winners.filter(winner => {
    if (selectedLotteryType !== 'all' && winner.lotteryTypeId !== parseInt(selectedLotteryType)) {
      return false;
    }
    
    const status = getWinnerStatus(winner);
    if (selectedStatus !== 'all' && status !== selectedStatus) {
      return false;
    }
    
    return true;
  });

  const filteredEmptyEvents = emptyEvents.filter(event => {
    if (selectedLotteryType !== 'all' && event.lotteryTypeId !== parseInt(selectedLotteryType)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Ganadores
        </h2>
        <p className="text-gray-600">Listado de ganadores y estado de premios</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Tipo de Lotería
            </label>
            <select
              value={selectedLotteryType}
              onChange={(e) => setSelectedLotteryType(e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="1">La Santa</option>
              <option value="2">La Rifa</option>
              <option value="3">El Sorteo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="PAID">Pagados</option>
              <option value="EXPIRED">Expirados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <Trophy className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Ganadores</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <Clock className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-600">Pendientes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          <p className="text-sm text-gray-600">Pagados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <Banknote className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-600">Q{stats.totalAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Total Premios</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <Gift className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-emerald-600">Q{stats.paidAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Ya Pagado</p>
        </div>

        {/* ✅ Nueva estadística: Sorteos Desiertos */}
        <div className="bg-white rounded-lg shadow p-4">
          <AlertTriangle className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-orange-600">{stats.emptyEvents}</p>
          <p className="text-sm text-gray-600">Sorteos Desiertos</p>
        </div>
      </div>

      {/* ✅ Sección de Sorteos Desiertos */}
      {filteredEmptyEvents.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow p-6">
          <div className="flex items-start mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                Sorteos Desiertos ({filteredEmptyEvents.length})
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Los siguientes sorteos no tuvieron ganadores:
              </p>
              <div className="space-y-2">
                {filteredEmptyEvents.map((event, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {event.lotteryTypeName} #{event.eventNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Número ganador: <span className="font-bold text-orange-600">
                            {String(event.winningNumber).padStart(2, '0')}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          Sin ganadores
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Ganadores */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              Ganadores del día ({filteredWinners.length})
            </h3>
            <button
              onClick={loadWinners}
              disabled={loading}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando ganadores...</p>
              </div>
            </div>
          ) : filteredWinners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No hay ganadores para mostrar</p>
              <p className="text-sm mt-2">
                {stats.emptyEvents > 0 
                  ? 'Todos los sorteos del día resultaron desiertos'
                  : 'Selecciona otra fecha o ajusta los filtros'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sorteo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWinners.map((winner, idx) => {
                    const status = getWinnerStatus(winner);
                    const badge = getStatusBadge(status);
                    const StatusIcon = badge.icon;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {winner.customerName || winner.fullName}
                              </div>
                              {winner.isBirthday && (
                                <div className="flex items-center text-xs text-pink-600 mt-1">
                                  <Gift className="w-3 h-3 mr-1" />
                                  Bonus cumpleaños
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {winner.lotteryTypeName} #{winner.eventNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Ganador: {String(winner.eventWinningNumber).padStart(2, '0')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-2xl font-bold text-blue-600">
                            {String(winner.chosenNumber).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Q{(winner.totalPrize || 0).toFixed(2)}
                          </div>
                          {winner.birthdayBonus > 0 && (
                            <div className="text-xs text-pink-600">
                              +Q{winner.birthdayBonus.toFixed(2)} bonus
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Winners;