import axios from 'axios';

// Configuración base de axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7173/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ========== LOTTERY TYPES ==========
export const lotteryTypeService = {
    getAll: () => api.get('/lottery-types'),
    getById: (id) => api.get(`/lottery-types/${id}`),
    create: (data) => api.post('/lottery-types', data),
    update: (id, data) => api.put(`/lottery-types/${id}`, data),
    delete: (id) => api.delete(`/lottery-types/${id}`),
};

// ========== LOTTERY EVENTS ==========
export const lotteryEventService = {
    getAll: (params) => api.get('/lottery-events', { params }),
    getById: (id) => api.get(`/lottery-events/${id}`),
    generateDaily: (date) => api.post('/lottery-events/generate-daily', { date }),
    openEvent: (id) => api.post(`/lottery-events/${id}/open`),
    closeEvent: (id) => api.post(`/lottery-events/${id}/close`),
    publishResults: (id, data) => api.post(`/lottery-events/${id}/results`, data),
    getWinners: (id) => api.get(`/lottery-events/${id}/winners`),
    getStats: (id) => api.get(`/lottery-events/${id}/stats`),
};

// ========== CUSTOMERS ==========
export const customerService = {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    search: (query) => api.get(`/customers/search?q=${query}`),
};

// ========== BETS ==========
export const betService = {
    getAll: (params) => api.get('/bets', { params }),
    getById: (id) => api.get(`/bets/${id}`),
    create: (data) => api.post('/bets', data),
    getByQr: (qrToken) => api.get(`/bets/qr/${qrToken}`),
    claim: (id) => api.post(`/bets/${id}/claim`),
};

// ========== PAYOUTS ==========
export const payoutService = {
    getAll: (params) => api.get('/payouts', { params }),
    getById: (id) => api.get(`/payouts/${id}`),
    getPendingByCustomer: (customerId) => api.get(`/payouts/pending/${customerId}`),
};

// ========== REPORTS ==========
export const reportService = {
    getDailySummary: (date) => api.get('/reports/daily-summary', { params: { date } }),
    getRevenuePeriod: (startDate, endDate, lotteryTypeId) =>
        api.get('/reports/revenue-period', {
            params: { startDate, endDate, lotteryTypeId }
        }),
    getMonthlyChart: (year, month) =>
        api.get('/reports/monthly-chart', { params: { year, month } }),
    getTopWinners: (year, month, criteriaType) =>
        api.get('/reports/top-winners', { params: { year, month, criteriaType } }),
};

// ========== USERS ==========
export const userService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// ========== AUTH (si lo implementas después) ==========
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    logout: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    },
    getCurrentUser: () => api.get('/auth/me'),
};

export default api;