import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Banknote, Trophy, Award, Download } from 'lucide-react';
import { reportService } from '../services/api';

function Reports() {
    const [activeTab, setActiveTab] = useState('monthly');

    // Estados para reporte mensual
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [monthlyData, setMonthlyData] = useState([]);

    // Estados para reporte por período
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedLotteryType, setSelectedLotteryType] = useState('all');
    const [periodData, setPeriodData] = useState(null);

    // Estados para Top 10
    const [topYear, setTopYear] = useState(new Date().getFullYear());
    const [topMonth, setTopMonth] = useState(new Date().getMonth() + 1);
    const [topCriteria, setTopCriteria] = useState('count');
    const [top10Winners, setTop10Winners] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'monthly') {
            loadMonthlyChart();
        }
    }, [selectedYear, selectedMonth, activeTab]);

    useEffect(() => {
        if (activeTab === 'top10') {
            loadTop10Winners();
        }
    }, [topYear, topMonth, topCriteria, activeTab]);

    // Cargar gráfica mensual
    const loadMonthlyChart = async () => {
        try {
            setLoading(true);
            const response = await reportService.getMonthlyChart(selectedYear, selectedMonth);

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                const data = response.data.detail || response.data.data || [];
                setMonthlyData(data);
            }
        } catch (err) {
            console.error('Error loading monthly chart:', err);
            setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };

    // Cargar reporte por período
    const loadPeriodReport = async () => {
        try {
            setLoading(true);
            const lotteryTypeId = selectedLotteryType === 'all' ? null : parseInt(selectedLotteryType);

            const response = await reportService.getRevenuePeriod(startDate, endDate, lotteryTypeId);

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                const data = response.data.detail || response.data.data;
                setPeriodData(data);
            }
        } catch (err) {
            console.error('Error loading period report:', err);
            setPeriodData(null);
        } finally {
            setLoading(false);
        }
    };

    // Cargar Top 10 ganadores
    const loadTop10Winners = async () => {
        try {
            setLoading(true);
            const response = await reportService.getTopWinners(topYear, topMonth, topCriteria);

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                const data = response.data.detail || response.data.data || [];
                setTop10Winners(data);
            }
        } catch (err) {
            console.error('Error loading top winners:', err);
            setTop10Winners([]);
        } finally {
            setLoading(false);
        }
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                    <TrendingUp className="w-8 h-8 mr-3 text-blue-500" />
                    Reportes y Estadísticas
                </h2>
                <p className="text-gray-600">Análisis de ingresos y ganadores</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-1 px-4">
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'monthly'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'
                                }`}
                        >
                            Gráfica Mensual
                        </button>
                        <button
                            onClick={() => setActiveTab('period')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'period'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'
                                }`}
                        >
                            Reporte por Período
                        </button>
                        <button
                            onClick={() => setActiveTab('top10')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'top10'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'
                                }`}
                        >
                            Top 10 Ganadores
                        </button>
                    </nav>
                </div>

                {/* Gráfica Mensual */}
                {activeTab === 'monthly' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Ingresos Diarios del Mes</h3>
                            <div className="flex items-center space-x-4">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index} value={index + 1}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {[2024, 2025, 2026].map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Cargando datos...</p>
                                </div>
                            </div>
                        ) : monthlyData.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600">No hay datos para este mes</p>
                            </div>
                        ) : (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="dayOfMonth"
                                            label={{ value: 'Día del Mes', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis
                                            label={{ value: 'Ingresos (Q)', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            formatter={(value) => `Q${value.toFixed(2)}`}
                                            labelFormatter={(label) => `Día ${label}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalCollected" fill="#10b981" name="Ingresos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {monthlyData.length > 0 && (
                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total del Mes</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        Q{monthlyData.reduce((sum, day) => sum + day.totalCollected, 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total de Apuestas</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {monthlyData.reduce((sum, day) => sum + day.totalBets, 0)}
                                    </p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Promedio Diario</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        Q{(monthlyData.reduce((sum, day) => sum + day.totalCollected, 0) / monthlyData.length).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Reporte por Período */}
                {activeTab === 'period' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-4">Reporte por Período Personalizado</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Fin
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Lotería
                                </label>
                                <select
                                    value={selectedLotteryType}
                                    onChange={(e) => setSelectedLotteryType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Todos</option>
                                    <option value="1">La Santa</option>
                                    <option value="2">La Rifa</option>
                                    <option value="3">El Sorteo</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={loadPeriodReport}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Cargando...' : 'Generar Reporte'}
                                </button>
                            </div>
                        </div>

                        {periodData && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                                        <Banknote className="w-8 h-8 text-green-600 mb-2" />
                                        <p className="text-3xl font-bold text-green-600">
                                            Q{periodData.totalCollected?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Recaudado</p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                        <Trophy className="w-8 h-8 text-blue-600 mb-2" />
                                        <p className="text-3xl font-bold text-blue-600">
                                            {periodData.totalBets || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Total de Apuestas</p>
                                    </div>
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                                        <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                                        <p className="text-3xl font-bold text-purple-600">
                                            Q{periodData.averageBetAmount?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-gray-600">Promedio por Apuesta</p>
                                    </div>
                                </div>

                                {periodData.eventDetails && periodData.eventDetails.length > 0 && (
                                    <div>
                                        <h4 className="font-bold mb-3">Detalle por Evento</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Sorteo
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Fecha
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Evento #
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Apuestas
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Recaudado
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            Estado
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {periodData.eventDetails.map((event, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {event.lotteryTypeName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {event.eventDate}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                #{event.eventNumberOfDay}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {event.totalBets}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                                Q{event.totalCollected.toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {event.state}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Top 10 Ganadores */}
                {activeTab === 'top10' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Top 10 Ganadores del Mes</h3>
                            <div className="flex items-center space-x-4">
                                <select
                                    value={topCriteria}
                                    onChange={(e) => setTopCriteria(e.target.value)}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="count">Por Veces Ganadas</option>
                                    <option value="amount">Por Dinero Ganado</option>
                                </select>
                                <select
                                    value={topMonth}
                                    onChange={(e) => setTopMonth(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={index} value={index + 1}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={topYear}
                                    onChange={(e) => setTopYear(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {[2024, 2025, 2026].map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Cargando datos...</p>
                                </div>
                            </div>
                        ) : top10Winners.length === 0 ? (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600">No hay datos para este mes</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {top10Winners.map((winner, index) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const medal = index < 3 ? medals[index] : null;
                                    const bgColors = [
                                        'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400',
                                        'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400',
                                        'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400',
                                        'bg-white border-gray-200'
                                    ];
                                    const bgColor = bgColors[Math.min(index, 3)];

                                    return (
                                        <div
                                            key={winner.customerId}
                                            className={`${bgColor} border-2 rounded-lg p-4 hover:shadow-lg transition-shadow`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-4xl">{medal || `#${index + 1}`}</div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900">
                                                            {winner.customerName}
                                                        </h4>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                            <span className="flex items-center">
                                                                <Trophy className="w-4 h-4 mr-1 text-green-600" />
                                                                {winner.winCount} {winner.winCount === 1 ? 'victoria' : 'victorias'}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Banknote className="w-4 h-4 mr-1 text-blue-600" />
                                                                Q{winner.totalWon.toFixed(2)} ganados
                                                            </span>
                                                            <span className="text-gray-500">
                                                                Promedio: Q{winner.averagePrize.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {topCriteria === 'count' ? (
                                                        <div>
                                                            <p className="text-3xl font-bold text-green-600">
                                                                {winner.winCount}
                                                            </p>
                                                            <p className="text-xs text-gray-500">victorias</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-3xl font-bold text-green-600">
                                                                Q{winner.totalWon.toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">total ganado</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reports;