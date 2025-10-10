import { useState, useEffect, useRef } from 'react';
import { betService, payoutService } from '../services/api';
import {
  Search, Trophy, User, Calendar, DollarSign, CheckCircle,
  XCircle, AlertCircle, Gift, Ticket, Clock
} from 'lucide-react';

function ClaimPrize() {
  const [searchQuery, setSearchQuery] = useState('');
  const [betResult, setBetResult] = useState(null);
  const [calculatedPayout, setCalculatedPayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const inputRef = useRef(null);

  // Detectar código desde URL al cargar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setSearchQuery(code);
      setTimeout(() => {
        handleSearchWithCode(code);
      }, 500);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Limpiar mensajes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearchWithCode = async (code) => {
    if (!code || !code.trim()) {
      setError('Por favor ingrese un código válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBetResult(null);
      setCalculatedPayout(null);

      const response = await betService.getByQr(code.trim());

      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const result = response.data.detail || response.data.data;
        setBetResult(result);

        if (result.isWinner && result.betState === 'WIN_PENDING') {
          await calculatePayout(result.betId);
        }
      }
    } catch (err) {
      console.error('Error searching bet:', err);
      const errorMsg = err.response?.data?.message || 'No se encontró la apuesta. Verifique el código QR.';
      setError(errorMsg);
      setBetResult(null);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await handleSearchWithCode(searchQuery);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const calculatePayout = async (betId) => {
    try {
      const response = await payoutService.calculate({ betId });

      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const calculation = response.data.detail || response.data.data;
        setCalculatedPayout(calculation);
      }
    } catch (err) {
      console.error('Error calculating payout:', err);
      setError(err.response?.data?.message || 'Error al calcular el premio');
    }
  };

  const handleProcessPayout = async () => {
    if (!betResult || !calculatedPayout) return;

    if (!confirm('¿Está seguro de procesar este pago? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || 1;

      const response = await payoutService.process({
        betId: betResult.betId,
        paidByUserId: userId
      });

      if (response.data.codeStatus === 201 || response.data.responseStatus === 0) {
        setSuccess(`¡Premio pagado exitosamente! Recibo: ${response.data.detail.receiptNumber}`);

        setTimeout(() => {
          setSearchQuery('');
          setBetResult(null);
          setCalculatedPayout(null);
          setSuccess(null);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Error processing payout:', err);
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    // Manejar diferentes formatos del backend
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Q0.00';
    return `Q${numAmount.toFixed(2)}`;
  };

  const getBetStateInfo = () => {
    if (!betResult) return null;

    // Normalizar estados - siempre trabajar con números
    const eventState = typeof betResult.eventState === 'string'
      ? ({ 'PROGRAMMED': 0, 'OPEN': 1, 'CLOSED': 2, 'RESULTS_PUBLISHED': 3 }[betResult.eventState] ?? betResult.eventState)
      : betResult.eventState;

    const betState = typeof betResult.betState === 'string'
      ? ({ 'ISSUED': 0, 'WIN_PENDING': 1, 'PAID': 2, 'EXPIRED': 3, 'VOID': 4 }[betResult.betState] ?? betResult.betState)
      : betResult.betState;

    if (eventState !== 3) {  // RESULTS_PUBLISHED
      return {
        color: 'bg-yellow-50 border-yellow-200',
        icon: <Clock className="w-6 h-6 text-yellow-600" />,
        title: 'Resultados Pendientes',
        message: 'Los resultados de este sorteo aún no han sido publicados.'
      };
    }

    if (!betResult.isWinner) {
      return {
        color: 'bg-red-50 border-red-200',
        icon: <XCircle className="w-6 h-6 text-red-600" />,
        title: 'No es Ganador',
        message: betResult.winningNumber
          ? `Número jugado: ${String(betResult.numberPlayed).padStart(2, '0')} | Número ganador: ${String(betResult.winningNumber).padStart(2, '0')}`
          : `Número jugado: ${String(betResult.numberPlayed).padStart(2, '0')}`
      };
    }

    if (betState === 2) {  // PAID
      return {
        color: 'bg-blue-50 border-blue-200',
        icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
        title: 'Premio Ya Pagado',
        message: `Pagado el ${formatDate(betResult.paidAt)} - Recibo: ${betResult.receiptNumber}`
      };
    }

    if (betState === 3) {  // EXPIRED
      return {
        color: 'bg-gray-50 border-gray-200',
        icon: <XCircle className="w-6 h-6 text-gray-600" />,
        title: 'Premio Expirado',
        message: 'El plazo para reclamar este premio ha vencido.'
      };
    }

    if (betState === 1) {  // WIN_PENDING
      return {
        color: 'bg-green-50 border-green-200',
        icon: <Trophy className="w-6 h-6 text-green-600" />,
        title: '¡Apuesta Ganadora!',
        message: 'Este premio está listo para ser pagado.'
      };
    }

    return null;
  };

  const stateInfo = getBetStateInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Reclamar Premio
        </h2>
        <p className="text-gray-600">Escanea el código QR o ingresa el código de la apuesta</p>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mensajes de Éxito */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">¡Éxito!</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código QR o ID de Apuesta
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingrese o escanee el código..."
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Resultados */}
      {betResult && (
        <div className="space-y-6">
          {/* Estado */}
          {stateInfo && (
            <div className={`${stateInfo.color} border rounded-lg p-6`}>
              <div className="flex items-start">
                {stateInfo.icon}
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">{stateInfo.title}</h3>
                  <p className="mt-1 text-sm text-gray-700">{stateInfo.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información de la Apuesta */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Ticket className="w-6 h-6 mr-2 text-blue-600" />
                Información de la Apuesta
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">{betResult.customerName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lotería</label>
                <span className="text-lg font-semibold text-gray-900">{betResult.lotteryTypeName}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Fecha del Sorteo</label>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">
                    {formatDate(betResult.eventDate)} - Sorteo #{betResult.eventNumberOfDay}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Número Jugado</label>
                <span className="text-3xl font-bold text-blue-600">
                  {String(betResult.numberPlayed).padStart(2, '0')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monto Apostado</label>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(betResult.amountBet || betResult.amount)}
                  </span>
                </div>
              </div>
              {betResult.winningNumber !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Número Ganador</label>
                  <span className={`text-3xl font-bold ${betResult.isWinner ? 'text-green-600' : 'text-red-600'}`}>
                    {String(betResult.winningNumber).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cálculo del Premio */}
          {calculatedPayout && betResult.betState === 1 && ( // 1 = WIN_PENDING
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-lg border-2 border-yellow-400">
              <div className="p-6 border-b border-yellow-300">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-7 h-7 mr-2 text-yellow-600" />
                  Cálculo del Premio
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Monto Apostado:</span>
                  <span className="text-lg font-semibold">{formatCurrency(calculatedPayout.betAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Factor de Pago:</span>
                  <span className="text-lg font-semibold">x{calculatedPayout.payoutFactor}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-yellow-300">
                  <span className="text-gray-700 font-medium">Premio Base:</span>
                  <span className="text-lg font-semibold">{formatCurrency(calculatedPayout.basePrize)}</span>
                </div>

                {calculatedPayout.isBirthday && (
                  <div className="bg-pink-50 border border-pink-300 rounded-lg p-4 space-y-2">
                    <div className="flex items-center text-pink-700 font-medium">
                      <Gift className="w-5 h-5 mr-2" />
                      ¡Bonificación de Cumpleaños!
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Bonus (10%):</span>
                      <span className="text-lg font-semibold text-pink-600">
                        +{formatCurrency(calculatedPayout.birthdayBonus)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-yellow-400 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total a Pagar:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(calculatedPayout.totalPrize)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProcessPayout}
                  disabled={processingPayment}
                  className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold text-lg mt-4 flex items-center justify-center"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Pagar Premio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Premio Pagado */}
          {betResult.betState === 2 && betResult.prizeAmount && ( // 2 = PAID
            <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Información del Pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Premio Pagado:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(betResult.prizeAmount)}
                  </span>
                </div>
                {betResult.birthdayBonusApplied && (
                  <div className="flex items-center text-pink-600">
                    <Gift className="w-4 h-4 mr-2" />
                    <span className="text-sm">Incluye bonificación de cumpleaños</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fecha de Pago:</span>
                  <span className="font-medium">{formatDate(betResult.paidAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recibo:</span>
                  <span className="font-mono font-medium">{betResult.receiptNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje inicial */}
      {!betResult && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Listo para escanear
          </h3>
          <p className="text-gray-500">
            Escanea el código QR del voucher o ingresa el código manualmente
          </p>
        </div>
      )}
    </div>
  );
}

export default ClaimPrize;