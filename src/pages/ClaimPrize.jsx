import { useState, useEffect, useRef } from 'react';
import { betService, payoutService } from '../services/api';
import { 
  Search, Trophy, User, Calendar, DollarSign, CheckCircle, 
  XCircle, AlertCircle, Gift, Ticket, Clock, Camera, X, Smartphone
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function ClaimPrize() {
  const [searchQuery, setSearchQuery] = useState('');
  const [betResult, setBetResult] = useState(null);
  const [calculatedPayout, setCalculatedPayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================
  // OPCIÓN 2: Detectar código desde URL
  // ============================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setSearchQuery(code);
      handleSearchWithCode(code);
      // Limpiar URL
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

  // ============================================
  // OPCIÓN 1: Escáner integrado con cámara
  // ============================================
  useEffect(() => {
    if (showScanner && scannerRef.current && !html5QrcodeScannerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);
      html5QrcodeScannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // QR escaneado exitosamente
          console.log('QR escaneado:', decodedText);
          
          // Si es una URL, extraer el código
          let code = decodedText;
          if (decodedText.includes('?code=')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1]);
            code = urlParams.get('code') || decodedText;
          }
          
          setSearchQuery(code);
          setShowScanner(false);
          scanner.clear();
          html5QrcodeScannerRef.current = null;
          
          // Buscar automáticamente
          handleSearchWithCode(code);
        },
        (error) => {
          // Silencioso, es normal durante el escaneo
        }
      );
    }

    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
        html5QrcodeScannerRef.current = null;
      }
    };
  }, [showScanner]);

  // ============================================
  // OPCIÓN 3: Auto-focus para lectores USB
  // ============================================
  useEffect(() => {
    // Auto-focus en el input cuando se carga la página
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Detectar Enter para lectores USB (simulan teclado)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const handleSearchWithCode = async (code) => {
    if (!code.trim()) {
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
      setError(err.response?.data?.message || 'No se encontró la apuesta. Verifique el código QR.');
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
          // Re-focus para siguiente transacción
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

  const toggleScanner = () => {
    if (showScanner && html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setShowScanner(!showScanner);
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
    return `Q${parseFloat(amount).toFixed(2)}`;
  };

  const getBetStateInfo = () => {
    if (!betResult) return null;

    if (betResult.eventState !== 'RESULTS_PUBLISHED') {
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
        message: `Número jugado: ${String(betResult.numberPlayed).padStart(2, '0')} | Número ganador: ${String(betResult.winningNumber).padStart(2, '0')}`
      };
    }

    if (betResult.betState === 'PAID') {
      return {
        color: 'bg-blue-50 border-blue-200',
        icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
        title: 'Premio Ya Pagado',
        message: `Pagado el ${formatDate(betResult.paidAt)} - Recibo: ${betResult.receiptNumber}`
      };
    }

    if (betResult.betState === 'EXPIRED') {
      return {
        color: 'bg-gray-50 border-gray-200',
        icon: <XCircle className="w-6 h-6 text-gray-600" />,
        title: 'Premio Expirado',
        message: 'El plazo para reclamar este premio ha vencido.'
      };
    }

    if (betResult.betState === 'WIN_PENDING') {
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

  // Generar URL con código QR para compartir
  const getShareableUrl = () => {
    return `${window.location.origin}/claim-prize?code=${betResult?.qrToken || searchQuery}`;
  };

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

      {/* Info de métodos de escaneo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Métodos de Escaneo
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>📱 <strong>Celular:</strong> Usa el botón "Escanear" para activar la cámara</li>
          <li>📷 <strong>App de Cámara:</strong> Escanea el QR y abrirá automáticamente esta página</li>
          <li>🔌 <strong>Lector USB:</strong> Simplemente escanea, el código se ingresará automáticamente</li>
        </ul>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
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
                type="button"
                onClick={toggleScanner}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {showScanner ? (
                  <>
                    <X className="w-5 h-5" />
                    Cerrar
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Escanear
                  </>
                )}
              </button>
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

        {/* Escáner QR */}
        {showScanner && (
          <div className="mt-6 border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Escáner de Código QR
              </h3>
              <button
                onClick={toggleScanner}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div id="qr-reader" ref={scannerRef}></div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Apunte la cámara hacia el código QR del voucher
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resultados... (resto del código igual que antes) */}
      {betResult && (
        <div className="space-y-6">
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
                    {formatCurrency(betResult.amount)}
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

          {calculatedPayout && betResult.betState === 'WIN_PENDING' && (
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

          {betResult.betState === 'PAID' && betResult.calculatedPrize && (
            <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Información del Pago</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Premio Pagado:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(betResult.calculatedPrize)}
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

      {!betResult && !loading && !showScanner && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Listo para escanear
          </h3>
          <p className="text-gray-500 mb-6">
            Use cualquiera de los métodos de escaneo disponibles
          </p>
          <button
            onClick={() => setShowScanner(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Abrir Escáner de Cámara
          </button>
        </div>
      )}
    </div>
  );
}

export default ClaimPrize;