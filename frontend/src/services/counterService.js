import api from './api';
import authService from './authService';

const counterService = {
  // Get all counters
  getAllCounters: async () => {
    try {
      const response = await api.get('/counters');
      return response;
    } catch (error) {
      console.error('Error getting counters:', error);
      return { success: false, error: error.message };
    }
  },

  // Get counter by ID
  getCounterById: async (counterId) => {
    try {
      const response = await api.get(`/counters/${counterId}`);
      return response;
    } catch (error) {
      console.error('Error getting counter:', error);
      return { success: false, error: error.message };
    }
  },

  // Get counter status
  getCounterStatus: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/employee/counters/status', token);
      return response;
    } catch (error) {
      console.error('Error getting counter status:', error);
      return { success: false, error: error.message };
    }
  },

  // Get counter stats (admin)
  getCounterStats: async (counterId) => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth(`/admin/counters/${counterId}/stats`, token);
      return response;
    } catch (error) {
      console.error('Error getting counter stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Update counter status (admin)
  updateCounterStatus: async (counterId, status) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/counters/status', {
        counterId,
        status
      }, token);
      return response;
    } catch (error) {
      console.error('Error updating counter status:', error);
      return { success: false, error: error.message };
    }
  },

  // Assign employee to counter (admin)
  assignEmployee: async (counterId, employeeId) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/counters/assign', {
        counterId,
        employeeId
      }, token);
      return response;
    } catch (error) {
      console.error('Error assigning employee:', error);
      return { success: false, error: error.message };
    }
  },

  // Unassign employee from counter (admin)
  unassignEmployee: async (counterId) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/admin/counters/unassign', {
        counterId
      }, token);
      return response;
    } catch (error) {
      console.error('Error unassigning employee:', error);
      return { success: false, error: error.message };
    }
  },

  // Add services to counter (admin)
  addServices: async (counterId, serviceCodes) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth(`/admin/counters/${counterId}/services`, {
        service_codes: serviceCodes
      }, token);
      return response;
    } catch (error) {
      console.error('Error adding services to counter:', error);
      return { success: false, error: error.message };
    }
  }
};

export default counterService;