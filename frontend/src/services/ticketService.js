// frontend /src/services/tivketService.js

import api from './api';

const ticketService = {
  getServices: async () => {
    try {
      const response = await api.get('/services');
      return response.services || [];
    } catch (error) {
      console.error('Error loading services:', error);
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
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  createVIPTicket: async (serviceCode, vipCode, customerName) => {
    try {
      const response = await api.post('/tickets/vip/generate', {
        service_code: serviceCode,
        vip_code: vipCode,
        customer_name: customerName
      });
      return response.ticket;
    } catch (error) {
      console.error('Error creating VIP ticket:', error);
      throw error;
    }
  },

  trackTicket: async (ticketNumber) => {
    try {
      const response = await api.get(`/tickets/${ticketNumber}`);
      return response.ticket;
    } catch (error) {
      console.error('Error tracking ticket:', error);
      throw error;
    }
  },

  getQueueStats: async () => {
    try {
      const response = await api.get('/queue/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }
};

export default ticketService;