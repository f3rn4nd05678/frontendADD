import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, Calendar, MapPin, Trophy, X } from 'lucide-react';
import { customerService } from '../services/api';

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        birthDate: '',
        address: ''
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 2 || searchQuery.length === 0) {
                loadCustomers();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await customerService.getAll({ search: searchQuery });

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                const data = response.data.detail || response.data.data || [];
                setCustomers(data);
            }
        } catch (err) {
            console.error('Error loading customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                fullName: customer.fullName,
                phone: customer.phone || '',
                email: customer.email || '',
                birthDate: customer.birthDate || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                fullName: '',
                phone: '',
                email: '',
                birthDate: '',
                address: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
            fullName: '',
            phone: '',
            email: '',
            birthDate: '',
            address: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            if (editingCustomer) {
                // Actualizar cliente existente
                const response = await customerService.update(editingCustomer.id, formData);
                if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                    alert('Cliente actualizado exitosamente');
                    handleCloseModal();
                    loadCustomers();
                }
            } else {
                // Crear nuevo cliente
                const response = await customerService.create(formData);
                if (response.data.codeStatus === 201 || response.data.responseStatus === 0) {
                    alert('Cliente creado exitosamente');
                    handleCloseModal();
                    loadCustomers();
                }
            }
        } catch (err) {
            console.error('Error saving customer:', err);
            alert('Error al guardar cliente: ' + (err.response?.data?.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (customerId) => {
        if (!confirm('¿Está seguro de deshabilitar este cliente? No podrá realizar nuevas apuestas.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await customerService.delete(customerId);

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                alert('Cliente deshabilitado exitosamente');
                loadCustomers();
            }
        } catch (err) {
            console.error('Error deleting customer:', err);

            let errorMsg = 'Error al deshabilitar cliente';

            if (err.response?.data) {
                const errorData = err.response.data;


                if (errorData.message) {
                    errorMsg = errorData.message;
                }

                if (errorData.codeStatus === 400 || err.response.status === 400) {
                    alert(` ${errorMsg}\n\nEl cliente tiene apuestas activas y no puede ser eliminado por seguridad.`);
                } else {
                    alert(errorMsg);
                }
            } else {
                alert('Error de conexión al intentar deshabilitar el cliente');
            }
        } finally {
            setLoading(false);
        }
    };


    const handleReactivate = async (customerId) => {
        if (!confirm('¿Está seguro de reactivar este cliente?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await customerService.reactivate(customerId);

            if (response.data.codeStatus === 200 || response.data.responseStatus === 0) {
                alert('Cliente reactivado exitosamente');
                loadCustomers();
            }
        } catch (err) {
            console.error('Error reactivating customer:', err);
            alert('Error al reactivar cliente');
        } finally {
            setLoading(false);
        }
    };

    const isBirthday = (birthDate) => {
        if (!birthDate) return false;
        const today = new Date();
        const birth = new Date(birthDate);
        return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                        <User className="w-8 h-8 mr-3 text-blue-500" />
                        Gestión de Clientes
                    </h2>
                    <p className="text-gray-600">Administra la información de tus clientes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Cliente</span>
                </button>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <User className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                    <p className="text-sm text-gray-600">Total de Clientes</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <Calendar className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-3xl font-bold text-green-600">
                        {customers.filter(c => isBirthday(c.birthDate)).length}
                    </p>
                    <p className="text-sm text-gray-600">Cumpleaños Hoy</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                    <p className="text-3xl font-bold text-yellow-600">
                        {customers.filter(c => c.totalWins > 0).length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Clientes con Premios</p>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Cargando clientes...</p>
                            </div>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 text-lg">No hay clientes para mostrar</p>
                            {searchQuery && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Intenta con otro término de búsqueda
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contacto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cumpleaños
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dirección
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                                            {customer.fullName}
                                                            {isBirthday(customer.birthDate) && (
                                                                <span className="ml-2 text-lg" title="¡Hoy es su cumpleaños!">
                                                                    🎂
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {customer.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 flex items-center">
                                                    <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                                    {customer.phone || 'N/A'}
                                                </div>
                                                {customer.email && (
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                                                        {customer.email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {customer.birthDate ? (
                                                    <div>
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(customer.birthDate).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {calculateAge(customer.birthDate)} años
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer.address ? (
                                                    <div className="text-sm text-gray-900 flex items-start">
                                                        <MapPin className="w-4 h-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{customer.address}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleOpenModal(customer)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Crear/Editar Cliente */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">
                                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de Nacimiento *
                                </label>
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows="2"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Guardando...' : (editingCustomer ? 'Actualizar' : 'Crear')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Customers;