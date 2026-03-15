import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to all requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Mock data for development/fallback
const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    collegeId: '2023001',
    department: 'Computer Science',
    year: '3rd',
    role: 'student',
    userStatus: 'ACTIVE',
    createdAt: '2023-10-15T10:30:00Z'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    collegeId: '2023002',
    department: 'Electronics',
    year: '4th',
    role: 'club_admin',
    userStatus: 'ACTIVE',
    createdAt: '2023-10-14T14:20:00Z'
  },
  {
    _id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    collegeId: '2023003',
    department: 'Mechanical',
    year: '2nd',
    role: 'student',
    userStatus: 'INACTIVE',
    createdAt: '2023-10-16T09:15:00Z'
  },
  {
    _id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    collegeId: '2023004',
    department: 'Civil',
    year: '3rd',
    role: 'student',
    userStatus: 'ACTIVE',
    createdAt: '2023-10-13T16:45:00Z'
  }
];

const mockDashboardData = {
  systemHealth: {
    status: 'healthy',
    score: 95,
    uptime: 86400
  },
  metrics: {
    totalUsers: 1850,
    totalClubs: 15,
    totalEvents: 120,
    activeUsers: 245
  },
  userBehavior: {
    dailyActiveUsers: 245,
    weeklyActiveUsers: 1200,
    userRetentionRate: 87,
    newUsers: 45,
    roleDistribution: {
      student: 1800,
      club_admin: 35,
      super_admin: 2
    }
  },
  clubPerformance: {
    topPerformingClubs: [
      { name: 'Coding Club', performanceScore: 85, totalEvents: 12 },
      { name: 'Drama Club', performanceScore: 72, totalEvents: 8 },
      { name: 'Robotics Club', performanceScore: 68, totalEvents: 10 }
    ]
  }
};

// Helper function for safe API calls
const safeApiCall = async (apiCall, mockData = null, errorMessage = 'API request failed') => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // Return mock data if provided
    if (mockData !== null) {
      console.log('⚠️ Using mock data due to API failure');
      return mockData;
    }
    
    // Otherwise throw the error
    throw error;
  }
};

// Day 3 API Services
export const adminService = {
  // ========== SUPER ADMIN SPECIFIC APIs ==========
  
  // Dashboard Stats - FIXED URLs to match routes
  getSystemPulse: () => api.get('/admin/analytics/pulse'),

  getUserBehavior: () => api.get('/admin/analytics/user-behavior'),

  getClubPerformance: () => api.get('/admin/analytics/club-performance'),

  getEventIntelligence: () => api.get('/admin/analytics/event-intelligence'),

  getRiskAlerts: () => api.get('/admin/analytics/risk-alerts'),

  getApprovalMetrics: () => api.get('/admin/analytics/approval-metrics'),

  getGrowthTrends: () => api.get('/admin/analytics/growth-trends'),

  exportSystemReport: () => api.get('/admin/analytics/export/system-report', {
    responseType: 'blob'
  }),

  // User Management
  getAllUsers: (page = 1, limit = 10, search = '') => safeApiCall(
    () => api.get('/admin/users', {
      params: { page, limit, search }
    }),
    {
      success: true,
      data: mockUsers.filter(user => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.collegeId.toLowerCase().includes(searchLower) ||
          user.department.toLowerCase().includes(searchLower)
        );
      }),
      total: mockUsers.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(mockUsers.length / limit)
    }
  ),

  changeUserRole: (userId, role) => safeApiCall(
    () => api.put(`/admin/users/${userId}/role`, { role }),
    {
      success: true,
      message: `User role updated to ${role}`,
      user: { _id: userId, role }
    }
  ),

  changeUserStatus: (userId, status) => safeApiCall(
    () => api.put(`/admin/users/${userId}/status`, { status }),
    {
      success: true,
      message: `User status updated to ${status}`,
      user: { _id: userId, userStatus: status }
    }
  ),

  deleteUser: (userId) => safeApiCall(
    () => api.delete(`/admin/users/${userId}`),
    {
      success: true,
      message: 'User deleted successfully'
    }
  ),

  // Club Management
  getAllClubs: (page = 1, limit = 10, search = '') => safeApiCall(
    () => api.get('/admin/clubs', {
      params: { page, limit, search }
    }),
    {
      success: true,
      data: [
        {
          _id: '1',
          name: 'Coding Club',
          email: 'coding@college.edu',
          category: 'TECHNICAL',
          president: { name: 'John Doe', email: 'john@college.edu' },
          performanceScore: 85,
          totalMembers: 50,
          totalEvents: 12,
          isActive: true
        },
        {
          _id: '2',
          name: 'Drama Club', 
          email: 'drama@college.edu',
          category: 'CULTURAL',
          president: { name: 'Jane Smith', email: 'jane@college.edu' },
          performanceScore: 72,
          totalMembers: 35,
          totalEvents: 8,
          isActive: true
        }
      ],
      total: 2,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: 1
    }
  ),

  updateClubPerformance: (clubId, performanceScore) => safeApiCall(
    () => api.put(`/admin/clubs/${clubId}/performance`, { performanceScore }),
    {
      success: true,
      message: `Club performance score updated to ${performanceScore}`,
      club: { _id: clubId, performanceScore }
    }
  ),

  // ========== DAY 3 APIs ==========
  
  // Profile Management
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getProfile: () => api.get('/users/profile'),
  
  // Event Management (Admin only)
  getAdminEvents: () => api.get('/events/admin/dashboard'),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  // Registration Management
  getEventRegistrations: (eventId) => api.get(`/events/${eventId}/registrations`),
  exportRegistrationsCSV: (eventId) => api.get(`/events/${eventId}/registrations/export`, {
    responseType: 'blob' // Important for file download
  }),
  updateRegistrationStatus: (eventId, registrationId, status) => 
    api.put(`/events/${eventId}/registrations/${registrationId}`, { status })
};

// Export for use in components
export default adminService;