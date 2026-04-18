import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://studentmanagement-zv5g.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (formData) => {
    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (formData) => {
    return api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getMarks: (id) => api.get(`/students/${id}/marks`),
  getAttendance: (id, params) => api.get(`/students/${id}/attendance`, { params }),
};

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getClasses: (id) => api.get(`/teachers/${id}/classes`),
};

// Classes API
export const classesAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  addStudent: (id, studentId) => api.post(`/classes/${id}/students`, { student_id: studentId }),
  removeStudent: (id, studentId) => api.delete(`/classes/${id}/students/${studentId}`),
  getAttendance: (id, params) => api.get(`/classes/${id}/attendance`, { params }),
  getMarks: (id, params) => api.get(`/classes/${id}/marks`, { params }),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getStats: (params) => api.get('/attendance/stats/overview', { params }),
  getMonthlyReport: (params) => api.get('/attendance/report/monthly', { params }),
};

// Marks API
export const marksAPI = {
  getAll: (params) => api.get('/marks', { params }),
  getById: (id) => api.get(`/marks/${id}`),
  create: (data) => api.post('/marks', data),
  createBulk: (data) => api.post('/marks/bulk', data),
  update: (id, data) => api.put(`/marks/${id}`, data),
  delete: (id) => api.delete(`/marks/${id}`),
  getStudentReport: (studentId) => api.get(`/marks/report/student/${studentId}`),
  getClassReport: (classId, params) => api.get(`/marks/report/class/${classId}`, { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAttendanceSummary: (params) => api.get('/dashboard/attendance-summary', { params }),
  getClassDistribution: () => api.get('/dashboard/class-distribution'),
  getGenderDistribution: () => api.get('/dashboard/gender-distribution'),
  exportData: (type) => api.get(`/dashboard/export/${type}`, { responseType: 'blob' }),
};

export default api;
