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
    openEvent: (id) => api.put(`/lottery-events/${id}/open`),
    closeEvent: (id) => api.put(`/lottery-events/${id}/close`),
    publishResults: (id, data) => api.put(`/lottery-events/${id}/publish-results`, data),
    getWinners: (id) => api.get(`/lottery-events/${id}/winners`),
    getStats: (id) => api.get(`/lottery-events/${id}/stats`),
};

// ========== CUSTOMERS ==========
export const customerService = {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    reactivate: (id) => api.put(`/customers/${id}/reactivate`),
    getInactive: () => api.get('/customers/inactive'),
    search: (query) => api.get('/customers', { params: { search: query } }),
};

// ========== PAYOUTS ==========
export const payoutService = {
    calculate: (data) => api.post('/payouts/calculate', data),
    
    process: (data) => api.post('/payouts/process', data),
    
    getPending: () => api.get('/payouts/pending'),
};

// ========== BETS  ==========
export const betService = {
    getAll: (params) => api.get('/bets', { params }),
    getById: (id) => api.get(`/bets/${id}`),
    getByQr: (qrToken) => api.get(`/bets/qr/${qrToken}`),
    
    create: (data) => api.post('/bets', data),
    getEventSummary: (eventId) => api.get(`/bets/event/${eventId}/summary`),
    getDailyWinners: (date) => api.get('/bets/winners/daily', { params: { date } }),
};

// ========== REPORTS ==========
export const reportService = {
    getDailySummary: (date) => api.get('/reports/daily-summary', { params: { date } }),
    getRevenuePeriod: (startDate, endDate, lotteryTypeId) =>
        api.get('/reports/collection', {
            params: { startDate, endDate, lotteryTypeId }
        }),
    getMonthlyChart: (year, month) => {
        console.log('Calling monthly chart with:', { year, month });
        return api.get('/reports/daily-collection', { params: { year, month } });
    },
    getTopWinners: (year, month, criteriaType) => {
        const endpoint = criteriaType === 'count'
            ? '/reports/top-winners-by-frequency'
            : '/reports/top-winners-by-amount';
        console.log('Calling top winners:', { endpoint, year, month, criteriaType });
        return api.get(endpoint, { params: { year, month } });
    },
};
// ========== USERS ==========
export const userService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// ========== AUTH ==========
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    logout: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    },
    getCurrentUser: () => api.get('/auth/me'),
};


export default api;