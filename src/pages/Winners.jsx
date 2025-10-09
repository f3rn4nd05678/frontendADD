import { useState, useEffect } from 'react';
import { Trophy, Calendar, Filter, Banknote, CheckCircle, Clock, XCircle, Gift } from 'lucide-react';
import { lotteryEventService, betService } from '../services/api';

function Winners() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [winners, setWinners] = useState([]);
  const [lotteryTypes, setLotteryTypes] = useState([]);
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
  });

  useEffect(() => {
    loadWinners();
  }, [selectedDate]);

  const loadWinners = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los eventos del día
      const eventsResponse = await lotteryEventService.getAll({ 
        date: selectedDate,
        state: 3 // COMPLETED
      });

      if (eventsResponse.data.codeStatus === 200 || eventsResponse.data.responseStatus === 0) {
        const events = eventsResponse.data.detail || eventsResponse.data.data || [];
        
        // Obtener ganadores de cada evento
        let allWinners = [];
        for (const event of events) {
          try {
            const winnersResponse = await lotteryEventService.getWinners(event.id);
            if (winnersResponse.data.codeStatus === 200 || winnersResponse.data.responseStatus === 0) {
              const eventWinners = winnersResponse.data.detail || winnersResponse.data.data || [];
              
              // Agregar información del evento a cada ganador
              const winnersWithEvent = eventWinners.map(w => ({
                ...w,
                eventId: event.id,
                lotteryTypeName: getLotteryTypeName(event.lotteryTypeId),
                lotteryTypeId: event.lotteryTypeId,
                eventDate: event.eventDate,
                eventNumber: event.eventNumberOfDay,
                winningNumber: event.winningNumber,
              }));
              
              allWinners = [...allWinners, ...winnersWithEvent];
            }
          } catch (err) {
            console.error(`Error loading winners for event ${event.id}:`, err);
          }
        }
        
        setWinners(allWinners);
        calculateStats(allWinners);
      }
    } catch (err) {
      console.error('Error loading winners:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLotteryTypeName = (lotteryTypeId) => {
    const names = {
      1: 'La Santa',
      2: 'La Rifa',
      3: 'El Sorteo'
    };
    return names[lotteryTypeId] || `Lotería ${lotteryTypeId}`;
  };

  const calculateStats = (winnersData) => {
    const total = winnersData.length;
    const pending = winnersData.filter(w => w.status === 'WIN_PENDING' || !w.paidAt).length;
    const paid = winnersData.filter(w => w.status === 'PAID' || w.paidAt).length;
    const expired = winnersData.filter(w => w.status === 'EXPIRED').length;
    const totalAmount = winnersData.reduce((sum, w) => sum + w.totalPrize, 0);
    const paidAmount = winnersData.filter(w => w.paidAt).reduce((sum, w) => sum + w.totalPrize, 0);

    setStats({ total, pending, paid, expired, totalAmount, paidAmount });
  };

  const getWinnerStatus = (winner) => {
    if (winner.paidAt) return 'PAID';
    if (winner.status === 'EXPIRED') return 'EXPIRED';
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      </div>

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
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-lg">No hay ganadores para mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWinners.map((winner, index) => {
                const status = getWinnerStatus(winner);
                const badge = getStatusBadge(status);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={`${winner.betId}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-lg text-gray-900">
                            {winner.customerName}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center`}>
                            <BadgeIcon className="w-3 h-3 mr-1" />
                            {badge.label}
                          </span>
                          {winner.isBirthday && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              🎂 Cumpleaños
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Sorteo:</span> {winner.lotteryTypeName}
                          </div>
                          <div>
                            <span className="font-medium">Evento:</span> #{winner.eventNumber}
                          </div>
                          <div>
                            <span className="font-medium">Número:</span>{' '}
                            <span className="font-bold text-green-600">
                              {String(winner.chosenNumber).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Apuesta:</span> Q{winner.betAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-600">
                          Q{winner.totalPrize.toFixed(2)}
                        </p>
                        {winner.birthdayBonus > 0 && (
                          <p className="text-xs text-yellow-600 font-semibold">
                            +Q{winner.birthdayBonus.toFixed(2)} bonus
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Base: Q{winner.basePrize.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Winners;