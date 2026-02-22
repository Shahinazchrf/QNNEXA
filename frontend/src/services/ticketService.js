import api from './api';

const ticketService = {
  getServices: async () => {
    try {
      const response = await api.get('/services');
      return response.services || [];
    } catch (error) {
      console.error('Erreur services:', error);
      throw error;
    }
  },

  createNormalTicket: async (serviceCode, customerName) => {
    try {
      const response = await api.post('/tickets/generate', {
        serviceCode,
        customerName
      });
      return response.ticket;
    } catch (error) {
      console.error('Erreur création ticket:', error);
      throw error;
    }
  },

  trackTicket: async (ticketNumber) => {
    try {
      const response = await api.get(`/tickets/${ticketNumber}`);
      return response.ticket;
    } catch (error) {
      console.error('Erreur suivi ticket:', error);
      throw error;
    }
  },

  getQueueStats: async () => {
    try {
      const response = await api.get('/queue/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur stats:', error);
      throw error;
    }
  }
};

export default ticketService;