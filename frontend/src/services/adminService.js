import api from './api';
import authService from './authService';

const adminService = {
  // Get admin dashboard
  getDashboard: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/admin/dashboard', token);
      return response;
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      return { success: false, error: error.message };
    }
  },

  // ===== USER MANAGEMENT =====
  getUsers: async (page = 1, limit = 20, role = null, search = null) => {
    try {
      const token = authService.getToken();
      let url = `/admin/users?page=${page}&limit=${limit}`;
      if (role) url += `&role=${role}`;
      if (search) url += `&search=${search}`;
      
      const response = await api.getAuth(url, token);
      return response;
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  createUser: async (userData) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/users', userData, token);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth(`/admin/users/${userId}`, userData, token);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  deleteUser: async (userId) => {
    try {
      const token = authService.getToken();
      const response = await api.deleteAuth(`/admin/users/${userId}`, token);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  },

  // ===== SERVICE MANAGEMENT =====
  getServices: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/admin/services', token);
      return response;
    } catch (error) {
      console.error('Error getting services:', error);
      return { success: false, error: error.message };
    }
  },

  createService: async (serviceData) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/services', serviceData, token);
      return response;
    } catch (error) {
      console.error('Error creating service:', error);
      return { success: false, error: error.message };
    }
  },

  updateService: async (serviceId, serviceData) => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth(`/admin/services/${serviceId}`, serviceData, token);
      return response;
    } catch (error) {
      console.error('Error updating service:', error);
      return { success: false, error: error.message };
    }
  },

  deleteService: async (serviceId) => {
    try {
      const token = authService.getToken();
      const response = await api.deleteAuth(`/admin/services/${serviceId}`, token);
      return response;
    } catch (error) {
      console.error('Error deleting service:', error);
      return { success: false, error: error.message };
    }
  },

  // ===== COUNTER MANAGEMENT =====
  getCounters: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/admin/counters', token);
      return response;
    } catch (error) {
      console.error('Error getting counters:', error);
      return { success: false, error: error.message };
    }
  },

  createCounter: async (counterData) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/counters', counterData, token);
      return response;
    } catch (error) {
      console.error('Error creating counter:', error);
      return { success: false, error: error.message };
    }
  },

  updateCounter: async (counterId, counterData) => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth(`/admin/counters/${counterId}`, counterData, token);
      return response;
    } catch (error) {
      console.error('Error updating counter:', error);
      return { success: false, error: error.message };
    }
  },

  deleteCounter: async (counterId) => {
    try {
      const token = authService.getToken();
      const response = await api.deleteAuth(`/admin/counters/${counterId}`, token);
      return response;
    } catch (error) {
      console.error('Error deleting counter:', error);
      return { success: false, error: error.message };
    }
  },

  // ===== AGENCY MANAGEMENT =====
  getAgencies: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/admin/agencies', token);
      return response;
    } catch (error) {
      console.error('Error getting agencies:', error);
      return { success: false, error: error.message };
    }
  },

  createAgency: async (agencyData) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/agencies', agencyData, token);
      return response;
    } catch (error) {
      console.error('Error creating agency:', error);
      return { success: false, error: error.message };
    }
  },

  updateAgency: async (agencyId, agencyData) => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth(`/admin/agencies/${agencyId}`, agencyData, token);
      return response;
    } catch (error) {
      console.error('Error updating agency:', error);
      return { success: false, error: error.message };
    }
  },

  deleteAgency: async (agencyId) => {
    try {
      const token = authService.getToken();
      const response = await api.deleteAuth(`/admin/agencies/${agencyId}`, token);
      return response;
    } catch (error) {
      console.error('Error deleting agency:', error);
      return { success: false, error: error.message };
    }
  },

  // ===== REPORTS =====
  generateReport: async (startDate, endDate, reportType = 'daily') => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/reports', {
        startDate,
        endDate,
        reportType
      }, token);
      return response;
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: error.message };
    }
  }
};

export default adminService;