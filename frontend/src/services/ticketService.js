import api from './api';
import authService from './authService';

const ticketService = {
  // Get all services
  getServices: async () => {
    try {
      const response = await api.get('/services');
      return response;
    } catch (error) {
      console.error('Error getting services:', error);
      return { success: false, error: error.message };
    }
  },

  // Create normal ticket
  createNormalTicket: async (serviceCode, customerName = 'Customer') => {
    try {
      const response = await api.post('/tickets/generate', {
        serviceCode,
        customerName
      });
      return response;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Create VIP ticket
  createVIPTicket: async (serviceCode, vipCode, customerName = 'VIP Client') => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/tickets/vip/generate', {
        service_code: serviceCode,
        vip_code: vipCode,
        customer_name: customerName
      }, token);
      return response;
    } catch (error) {
      console.error('Error creating VIP ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Book VIP appointment
  bookVIPAppointment: async (serviceCode, appointmentTime, vipCode, reason = '') => {
    try {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      const response = await api.postAuth('/tickets/vip-appointment', {
        clientId: user?.id,
        serviceCode,
        appointmentTime,
        reason,
        vipCode
      }, token);
      
      return response;
    } catch (error) {
      console.error('Error booking appointment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get queue status
  getQueueStatus: async (serviceCode = null) => {
    try {
      const url = serviceCode ? `/tickets/queue?serviceCode=${serviceCode}` : '/tickets/queue';
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ticket by ID or number
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response;
    } catch (error) {
      console.error('Error getting ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ticket position
  getTicketPosition: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/position`);
      return response;
    } catch (error) {
      console.error('Error getting ticket position:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel ticket
  cancelTicket: async (ticketId, reason = '') => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth(`/tickets/${ticketId}/cancel`, { reason }, token);
      return response;
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all tickets (admin)
  getAllTickets: async (status = null, limit = 50) => {
    try {
      const token = authService.getToken();
      const url = status ? `/tickets?status=${status}&limit=${limit}` : `/tickets?limit=${limit}`;
      const response = await api.getAuth(url, token);
      return response;
    } catch (error) {
      console.error('Error getting all tickets:', error);
      return { success: false, error: error.message };
    }
  },

  // Get queue statistics
  getQueueStats: async (serviceCode = null) => {
    try {
      const url = serviceCode ? `/queue/stats?service_code=${serviceCode}` : '/queue/stats';
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Call next ticket (employee)
  callNextTicket: async (counterId) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/employee/call-next', { counterId }, token);
      return response;
    } catch (error) {
      console.error('Error calling next ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Complete ticket (employee)
  completeTicket: async (ticketId) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth(`/tickets/${ticketId}/complete`, {}, token);
      return response;
    } catch (error) {
      console.error('Error completing ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Start serving ticket (employee)
  startServing: async (ticketId) => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/employee/start-serving', { ticketId }, token);
      return response;
    } catch (error) {
      console.error('Error starting service:', error);
      return { success: false, error: error.message };
    }
  },

  // Get employee dashboard
  getEmployeeDashboard: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/employee/dashboard', token);
      return response;
    } catch (error) {
      console.error('Error getting employee dashboard:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current ticket for counter
  getCurrentTicket: async (counterId) => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth(`/employee/ticket/current?counterId=${counterId}`, token);
      return response;
    } catch (error) {
      console.error('Error getting current ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Transfer ticket (admin)
  transferTicket: async (ticketId, newServiceCode, reason = '') => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/tickets/transfer', {
        ticketId,
        newServiceCode,
        reason
      }, token);
      return response;
    } catch (error) {
      console.error('Error transferring ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Prioritize ticket (admin)
  prioritizeTicket: async (ticketId, priority, reason = '') => {
    try {
      const token = authService.getToken();
      const response = await api.postAuth('/priority/prioritize/' + ticketId, {
        priority,
        reason
      }, token);
      return response;
    } catch (error) {
      console.error('Error prioritizing ticket:', error);
      return { success: false, error: error.message };
    }
  }
};

export default ticketService;