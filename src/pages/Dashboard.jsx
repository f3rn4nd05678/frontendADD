import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, TrendingUp, Users, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { reportService, lotteryEventService } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayBets: 0,
    activeCustomers: 0,
    pendingPayouts: 0,
  });
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Cargar resumen del día
      try {
        const summaryRes = await reportService.getDailySummary(today);
        // ✅ FIX: Cambiar condición de responseStatus === 1 a === 0
        if (summaryRes.data.codeStatus === 200 || summaryRes.data.responseStatus === 0) {
          const data = summaryRes.data.detail || summaryRes.data.data;
          setStats({
            todayRevenue: data?.totalCollected || 0,
            todayBets: data?.totalBets || 0,
            activeCustomers: data?.totalEvents || 0,
            pendingPayouts: data?.totalWinners || 0,
          });
        }
      } catch (err) {
        console.error('Error loading summary:', err);
      }

      // Cargar eventos de hoy
      try {
        const eventsRes = await lotteryEventService.getAll({ date: today });
        // ✅ FIX: Cambiar condición de responseStatus === 1 a === 0
        if (eventsRes.data.codeStatus === 200 || eventsRes.data.responseStatus === 0) {
          const events = eventsRes.data.detail || eventsRes.data.data || [];
          setTodayEvents(events);
        }
      } catch (err) {
        console.error('Error loading events:', err);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  // ✅ Componente EventCard
  const EventCard = ({ event }) => {
    const getStateIcon = (state) => {
      const stateNum = typeof state === 'number' ? state : state;
      const stateMap = { 0: 'PROGRAMMED', 1: 'OPEN', 2: 'CLOSED', 3: 'RESULTS_PUBLISHED' };
      const stateName = typeof state === 'number' ? stateMap[state] : state;
      
      switch (stateName) {
        case 'OPEN':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'CLOSED':
          return <Clock className="w-5 h-5 text-yellow-600" />;
        case 'RESULTS_PUBLISHED':
          return <Trophy className="w-5 h-5 text-blue-600" />;
        default:
          return <Clock className="w-5 h-5 text-gray-600" />;
      }
    };

    const getStateText = (state) => {
      const stateNum = typeof state === 'number' ? state : state;
      const stateMap = { 0: 'PROGRAMMED', 1: 'OPEN', 2: 'CLOSED', 3: 'RESULTS_PUBLISHED' };
      const stateName = typeof state === 'number' ? stateMap[state] : state;
      
      switch (stateName) {
        case 'PROGRAMMED': return 'Programado';
        case 'OPEN': return 'Abierto';
        case 'CLOSED': return 'Cerrado';
        case 'RESULTS_PUBLISHED': return 'Completado';
        default: return stateName;
      }
    };

    const getStateColor = (state) => {
      const stateNum = typeof state === 'number' ? state : state;
      const stateMap = { 0: 'PROGRAMMED', 1: 'OPEN', 2: 'CLOSED', 3: 'RESULTS_PUBLISHED' };
      const stateName = typeof state === 'number' ? stateMap[state] : state;
      
      switch (stateName) {
        case 'PROGRAMMED': return 'bg-gray-100 text-gray-800';
        case 'OPEN': return 'bg-green-100 text-green-800';
        case 'CLOSED': return 'bg-yellow-100 text-yellow-800';
        case 'RESULTS_PUBLISHED': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getLotteryTypeName = (typeId) => {
      const types = { 1: 'La Santa', 2: 'La Rifa', 3: 'El Sorteo' };
      return types[typeId] || `Tipo ${typeId}`;
    };

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center space-x-4">
          {getStateIcon(event.state)}
          <div>
            <p className="font-semibold text-gray-900">
              {getLotteryTypeName(event.lotteryTypeId)} #{event.eventNumberOfDay}
            </p>
            <p className="text-sm text-gray-600">
              {event.openTime} - {event.closeTime}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {event.winningNumber !== null && (
            <div className="text-right mr-3">
              <p className="text-xs text-gray-500">Número ganador</p>
              <p className="text-2xl font-bold text-blue-600">
                {String(event.winningNumber).padStart(2, '0')}
              </p>
            </div>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(event.state)}`}>
            {getStateText(event.state)}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Resumen de actividad del día</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos Hoy"
          value={`Q${stats.todayRevenue.toFixed(2)}`}
          icon={Banknote}
          color="text-green-600"
          subtitle={`${stats.todayBets} apuestas`}
        />
        <StatCard
          title="Eventos"
          value={stats.activeCustomers}
          icon={Users}
          color="text-blue-600"
          subtitle="Total de eventos"
        />
        <StatCard
          title="Ganadores"
          value={stats.pendingPayouts}
          icon={Trophy}
          color="text-yellow-600"
          subtitle="Del día"
        />
        <StatCard
          title="Total Apuestas"
          value={stats.todayBets}
          icon={TrendingUp}
          color="text-purple-600"
          subtitle="Tickets emitidos"
        />
      </div>

      {/* Today's Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Eventos de Hoy</h3>
          <button
            onClick={loadDashboardData}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Actualizar
          </button>
        </div>

        {todayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay eventos programados para hoy</p>
            <button 
              onClick={() => navigate('/events')}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Generar Eventos del Día
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ✅ Botón Vender Apuesta */}
        <button 
          onClick={() => navigate('/sell')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-lg transition-colors"
        >
          <h4 className="font-bold text-lg">Vender Apuesta</h4>
          <p className="text-sm mt-1 opacity-90">Crear nueva apuesta para cliente</p>
        </button>

        {/* ✅ Botón Reclamar Premio */}
        <button 
          onClick={() => navigate('/claim')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-lg transition-colors"
        >
          <h4 className="font-bold text-lg">Reclamar Premio</h4>
          <p className="text-sm mt-1 opacity-90">Escanear QR y pagar premio</p>
        </button>

        {/* ✅ Botón Ver Reportes */}
        <button 
          onClick={() => navigate('/reports')}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-lg transition-colors"
        >
          <h4 className="font-bold text-lg">Ver Reportes</h4>
          <p className="text-sm mt-1 opacity-90">Estadísticas y análisis</p>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;