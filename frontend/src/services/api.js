import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ AUTHENTICATION ENDPOINTS ============
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const verifyOTP = (otpData) => API.post('/auth/verify-otp', otpData);
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (profileData) => API.put('/users/profile', profileData);

// ============ EVENT ENDPOINTS ============
export const getAllEvents = () => API.get('/events');
export const getEvent = (id) => API.get(`/events/${id}`);
export const createEvent = (eventData) => API.post('/events', eventData);
export const updateEvent = (id, eventData) => API.put(`/events/${id}`, eventData);
export const deleteEvent = (id) => API.delete(`/events/${id}`);
export const registerForEvent = (id) => API.post(`/events/${id}/register`);
export const getEventRegistrations = (id) => API.get(`/events/${id}/registrations`);
export const exportRegistrations = (id) => API.get(`/events/${id}/registrations/export`);
export const getAdminDashboard = () => API.get('/events/admin/dashboard');

// ============ SUPER ADMIN ANALYTICS ENDPOINTS ============
export const getAnalyticsDashboard = () => API.get('/admin/analytics/dashboard');
export const getSystemPulse = () => API.get('/admin/analytics/system-pulse');
export const getUserBehavior = () => API.get('/admin/analytics/user-behavior');
export const getClubPerformance = () => API.get('/admin/analytics/club-performance');
export const getEventIntelligence = () => API.get('/admin/analytics/event-intelligence');
export const getRiskAlerts = () => API.get('/admin/analytics/risk-alerts');
export const getApprovalMetrics = () => API.get('/admin/analytics/approval-metrics');
export const getGrowthTrends = () => API.get('/admin/analytics/growth-trends');
export const exportSystemReport = () => API.get('/admin/analytics/export/system-report', {
  responseType: 'blob'
});

// ============ SUPER ADMIN USER MANAGEMENT ============
export const getAllUsers = (params = {}) => API.get('/admin/users', { params });
export const getUserById = (id) => API.get(`/admin/users/${id}`);
export const updateUser = (id, userData) => API.put(`/admin/users/${id}`, userData);
export const changeUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const changeUserStatus = (id, status) => API.put(`/admin/users/${id}/status`, { status });
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const exportUsers = (format) => API.get(`/admin/users/export/${format}`);

// ============ SUPER ADMIN CLUB MANAGEMENT ============
export const getAllClubs = (params = {}) => API.get('/admin/clubs', { params });
export const getClubById = (id) => API.get(`/admin/clubs/${id}`);
export const createClub = (clubData) => API.post('/admin/clubs', clubData);
export const updateClub = (id, clubData) => API.put(`/admin/clubs/${id}`, clubData);
export const deleteClub = (id) => API.delete(`/admin/clubs/${id}`);
export const assignClubAdmin = (id, userId) => API.post(`/admin/clubs/${id}/assign-admin`, { userId });
export const updateClubPerformance = (id, performanceScore) => 
  API.put(`/admin/clubs/${id}/performance`, { performanceScore });
export const updateClubStatus = (id, statusData) => 
  API.put(`/admin/clubs/${id}/status`, statusData);

// ============ SUPER ADMIN BULK OPERATIONS ============
export const bulkImportUsers = (users) => API.post('/admin/bulk/users', { users });
export const bulkDeleteUsers = (userIds) => API.delete('/admin/bulk/users', { data: { userIds } });
export const bulkUpdateUserStatus = (userIds, status) => 
  API.put('/admin/bulk/users/status', { userIds, status });
export const bulkUpdateUserRole = (userIds, role) => 
  API.put('/admin/bulk/users/role', { userIds, role });
export const bulkExportUsers = () => API.get('/admin/bulk/users/export');

// ============ SYSTEM HEALTH ENDPOINTS ============
export const checkHealth = () => API.get('/health');
export const checkDBStatus = () => API.get('/db-status');
export const checkAnalyticsHealth = () => API.get('/analytics/health');

// ============ ERROR INTERCEPTOR ============
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout if 401 response returned from api
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;