import { useState, useEffect, useRef } from 'react';
import { Search, User, Calendar, DollarSign, Ticket, Printer, Plus } from 'lucide-react';
import { customerService, lotteryEventService, betService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

function SellBet() {
  // Estados principales
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Estados de eventos y apuestas
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [betNumber, setBetNumber] = useState('');
  const [betAmount, setBetAmount] = useState('');
  
  // Estado para el voucher
  const [lastBet, setLastBet] = useState(null);
  const [showVoucher, setShowVoucher] = useState(false);
  
  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const voucherRef = useRef();

  useEffect(() => {
    loadTodayEvents();
  }, [selectedDate]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Esperar 500ms después de que el usuario termine de escribir
      const timeoutId = setTimeout(() => {
        searchCustomers();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setCustomers([]);
      setShowCustomerSearch(false);
    }
  }, [searchQuery]);

  // Cargar eventos del día que estén abiertos
  const loadTodayEvents = async () => {
    try {
      const response = await lotteryEventService.getAll({ date: selectedDate, state: 'OPEN' });
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const eventData = response.data.detail || response.data.data || [];
        setTodayEvents(eventData);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Error al cargar eventos del día');
    }
  };

  // Buscar clientes
  const searchCustomers = async () => {
    try {
      const response = await customerService.search(searchQuery);
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
        const customerData = response.data.detail || response.data.data || [];
        setCustomers(customerData);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
    }
  };

  // Crear nuevo cliente
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      setLoading(true);
      const customerData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        birthDate: formData.get('birthDate'),
        email: formData.get('email') || null,
        address: formData.get('address') || null,
      };

      const response = await customerService.create(customerData);
      
      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 201 || response.data.responseStatus === 0) {
        const newCustomer = response.data.detail || response.data.data;
        setSelectedCustomer(newCustomer);
        setShowNewCustomerForm(false);
        setShowCustomerSearch(false);
        alert('Cliente creado exitosamente');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Error al crear cliente: ' + (err.response?.data?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Crear apuesta
  const handleCreateBet = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert('Debe seleccionar un cliente');
      return;
    }

    if (!selectedEvent) {
      alert('Debe seleccionar un sorteo');
      return;
    }

    const number = parseInt(betNumber);
    if (isNaN(number) || number < 0 || number > 99) {
      alert('El número debe estar entre 00 y 99');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const betData = {
        customerId: selectedCustomer.id,
        eventId: selectedEvent.id,
        userId: 1, // Usuario por defecto (temporalmente hasta implementar login)
        numberPlayed: number,
        amount: amount,
      };

      const response = await betService.create(betData);

      // Adaptarse a la respuesta del backend
      if (response.data.codeStatus === 201 || response.data.responseStatus === 0) {
        const newBet = response.data.detail || response.data.data;
        
        
        setLastBet(newBet);
        setShowVoucher(true);
        
        // Limpiar formulario
        setBetNumber('');
        setBetAmount('');
        setSelectedEvent(null);
        
        alert('Apuesta creada exitosamente');
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error creating bet:', err);
      setError(err.response?.data?.message || 'Error al crear la apuesta');
    } finally {
      setLoading(false);
    }
  };

  // Imprimir voucher
  const handlePrintVoucher = () => {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(voucherRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Función para verificar si es cumpleaños del cliente
  const isBirthday = (birthDate) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Vender Apuesta</h2>
          <p className="text-gray-600">Registra una nueva apuesta para un cliente</p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadTodayEvents}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mt-5"
          >
            Actualizar Eventos
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección de Cliente */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Cliente
            </h3>

            {!selectedCustomer ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowCustomerSearch(true);
                    }}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {showCustomerSearch && customers.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="font-medium">{customer.fullName}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Cliente</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-bold text-lg">{selectedCustomer.fullName}</p>
                  <p className="text-sm text-gray-600">Tel: {selectedCustomer.phone}</p>
                  {selectedCustomer.email && (
                    <p className="text-sm text-gray-600">Email: {selectedCustomer.email}</p>
                  )}
                  {isBirthday(selectedCustomer.birthDate) && (
                    <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded p-2">
                      <p className="text-sm font-bold text-yellow-800">🎉 ¡Feliz Cumpleaños!</p>
                      <p className="text-xs text-yellow-700">Bonus del 10% aplicado</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full text-red-600 hover:text-red-700 font-medium"
                >
                  Cambiar Cliente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Apuesta */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Ticket className="w-5 h-5 mr-2" />
              Detalles de la Apuesta
            </h3>

            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No hay eventos abiertos para apuestas</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBet} className="space-y-4">
                {/* Selección de Evento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona el Sorteo
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayEvents.map((event) => {
                      // Mapeo de payoutFactor por lotteryTypeId
                      const payoutFactors = {
                        1: 25.00,   // La Santa
                        2: 70.00,   // La Rifa
                        3: 150.00   // El Sorteo
                      };
                      
                      const lotteryNames = {
                        1: 'La Santa',
                        2: 'La Rifa',
                        3: 'El Sorteo'
                      };

                      const payoutFactor = event.payoutFactor || payoutFactors[event.lotteryTypeId] || 0;
                      const lotteryName = event.lotteryTypeName || lotteryNames[event.lotteryTypeId] || `Lotería ${event.lotteryTypeId}`;

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => {
                            // Agregar payoutFactor al evento seleccionado
                            setSelectedEvent({
                              ...event,
                              payoutFactor: payoutFactor,
                              lotteryTypeName: lotteryName
                            });
                          }}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            selectedEvent?.id === event.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <p className="font-bold text-gray-900">{lotteryName}</p>
                          <p className="text-sm text-gray-600">
                            Sorteo #{event.sequenceNumber || event.eventNumberOfDay}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.openTime} - {event.closeTime}
                          </p>
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            Paga: Q{payoutFactor.toFixed(2)} por Q1
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedEvent && (
                  <>
                    {/* Número de Apuesta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número (00-99)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={betNumber}
                        onChange={(e) => setBetNumber(e.target.value)}
                        placeholder="Ingresa el número"
                        required
                        className="w-full px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Monto de Apuesta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto a Apostar
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="w-full pl-10 pr-4 py-3 text-xl border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      {betAmount && selectedEvent && (
                        <p className="mt-2 text-sm text-gray-600">
                          Premio potencial: <span className="font-bold text-green-600">
                            Q{(parseFloat(betAmount) * (selectedEvent.payoutFactor || 0)).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Botón de Confirmar */}
                    <button
                      type="submit"
                      disabled={loading || !selectedCustomer}
                      className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Procesando...' : 'Confirmar Apuesta'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Cliente */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Nuevo Cliente</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  name="address"
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Guardando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Voucher */}
      {showVoucher && lastBet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div ref={voucherRef} className="space-y-4">
              {/* Voucher */}
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-green-600">🎰 LA SUERTE</h2>
                  <p className="text-sm text-gray-600">Sistema de Sorteos</p>
                </div>

                <div className="border-t border-b border-gray-300 py-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cliente:</span>
                    <span className="font-semibold">{lastBet.customerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sorteo:</span>
                    <span className="font-semibold">{lastBet.lotteryTypeName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Evento:</span>
                    <span className="font-semibold">#{lastBet.eventSequenceNumber || lastBet.eventNumberOfDay || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Número:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {String(lastBet.chosenNumber || lastBet.numberPlayed || 0).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Apuesta:</span>
                    <span className="font-bold">Q{(lastBet.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Premio Potencial:</span>
                    <span className="font-bold text-green-600">
                      Q{(lastBet.potentialPayout || (lastBet.amount * (selectedEvent?.payoutFactor || 0)) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="text-gray-500">
                      {lastBet.createdAt ? new Date(lastBet.createdAt).toLocaleString() : new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  {lastBet.qrToken && <QRCodeSVG value={lastBet.qrToken} size={150} />}
                </div>

                {lastBet.qrToken && (
                  <>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Código: {lastBet.qrToken.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-center text-gray-500 mt-1">
                      Válido por 5 días hábiles
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowVoucher(false);
                  setLastBet(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintVoucher}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellBet;