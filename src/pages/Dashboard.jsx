import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Trophy } from 'lucide-react';
import { reportService, lotteryEventService } from '../services/api';

function Dashboard() {
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
      const summaryRes = await reportService.getDailySummary(today);
      if (summaryRes.data.responseStatus === 1) {
        setStats({
          todayRevenue: summaryRes.data.data.totalRevenue || 0,
          todayBets: summaryRes.data.data.totalBets || 0,
          activeCustomers: summaryRes.data.data.uniqueCustomers || 0,
          pendingPayouts: summaryRes.data.data.pendingPayouts || 0,
        });
      }

      // Cargar eventos de hoy
      const eventsRes = await lotteryEventService.getAll({ date: today });
      if (eventsRes.data.responseStatus === 1) {
        setTodayEvents(eventsRes.data.data || []);
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
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  const EventCard = ({ event }) => {
    const getStateColor = (state) => {
      switch (state) {
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

    const getStateText = (state) => {
      switch (state) {
        case 'PENDING':
          return 'Pendiente';
        case 'OPEN':
          return 'Abierto';
        case 'CLOSED':
          return 'Cerrado';
        case 'COMPLETED':
          return 'Completado';
        default:
          return state;
      }
    };

    return (
      <div className="border-l-4 border-green-500 bg-white p-4 rounded-r-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{event.lotteryTypeName}</h4>
            <p className="text-sm text-gray-600">
              Sorteo #{event.sequenceNumber} - {event.openTime} - {event.closeTime}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStateColor(event.state)}`}>
            {getStateText(event.state)}
          </span>
        </div>
        {event.winningNumber !== null && (
          <div className="mt-2 bg-yellow-50 p-2 rounded">
            <p className="text-sm font-semibold text-yellow-800">
              Número Ganador: <span className="text-2xl">{String(event.winningNumber).padStart(2, '0')}</span>
            </p>
          </div>
        )}
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
          icon={DollarSign}
          color="text-green-600"
          subtitle={`${stats.todayBets} apuestas`}
        />
        <StatCard
          title="Clientes Activos"
          value={stats.activeCustomers}
          icon={Users}
          color="text-blue-600"
          subtitle="Clientes únicos hoy"
        />
        <StatCard
          title="Premios Pendientes"
          value={stats.pendingPayouts}
          icon={Trophy}
          color="text-yellow-600"
          subtitle="Por reclamar"
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
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
        <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-lg transition-colors">
          <h4 className="font-bold text-lg">Vender Apuesta</h4>
          <p className="text-sm mt-1 opacity-90">Crear nueva apuesta para cliente</p>
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-lg transition-colors">
          <h4 className="font-bold text-lg">Reclamar Premio</h4>
          <p className="text-sm mt-1 opacity-90">Escanear QR y pagar premio</p>
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-lg transition-colors">
          <h4 className="font-bold text-lg">Ver Reportes</h4>
          <p className="text-sm mt-1 opacity-90">Estadísticas y análisis</p>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;