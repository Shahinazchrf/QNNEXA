import api from './api';

const statsService = {
  // Get daily statistics
  getDailyStats: async (date = null) => {
    try {
      const url = date ? `/stats/daily?date=${date}` : '/stats/daily';
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get real-time statistics
  getRealTimeStats: async () => {
    try {
      const response = await api.get('/stats/realtime');
      return response;
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get period statistics
  getPeriodStats: async (startDate, endDate) => {
    try {
      const response = await api.get(`/stats/period?start=${startDate}&end=${endDate}`);
      return response;
    } catch (error) {
      console.error('Error getting period stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get service statistics
  getServiceStats: async (startDate = null, endDate = null) => {
    try {
      let url = '/stats/services';
      if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error getting service stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get counter statistics
  getCounterStats: async (startDate = null, endDate = null) => {
    try {
      let url = '/stats/counters';
      if (startDate && endDate) {
        url += `?start=${startDate}&end=${endDate}`;
      }
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error getting counter stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get employee performance
  getEmployeePerformance: async (employeeId, period = 'month') => {
    try {
      const response = await api.get(`/stats/employee/${employeeId}?period=${period}`);
      return response;
    } catch (error) {
      console.error('Error getting employee performance:', error);
      return { success: false, error: error.message };
    }
  }
};

export default statsService;