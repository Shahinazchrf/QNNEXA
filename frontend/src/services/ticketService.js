// frontend/src/services/ticketService.js

// IMPORTS
import api from './api';

// Fonction simple pour récupérer le token
const getToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
};

const ticketService = {
  // Get all services
  getServices: async () => {
    try {
      console.log('Fetching services from API...');
      const response = await api.get('/services');
      return response;
    } catch (error) {
      console.error('Error getting services:', error);
      return { success: false, error: error.message };
    }
  },

  // Create normal ticket
  createNormalTicket: async (serviceCode, customerName = 'Customer', ticketType = 'virtual') => {
    try {
      const response = await api.post('/tickets/generate', {
        serviceCode,
        customerName,
        ticketType
      });
      return response;
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Create VIP ticket
  createVIPTicket: async (serviceCode, vipCode, customerName = 'VIP Client') => {
    try {
      const token = getToken();
      const response = await fetch('http://10.30.245.243:5000/api/tickets/vip/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          service_code: serviceCode,
          vip_code: vipCode,
          customer_name: customerName
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating VIP ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Book VIP appointment
  bookVIPAppointment: async (serviceCode, appointmentTime, vipCode, reason = '') => {
    try {
      const token = getToken();
      const response = await fetch('http://10.30.245.243:5000/api/tickets/vip-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          serviceCode,
          appointmentTime,
          vipCode,
          reason
        })
      });
      const data = await response.json();
      return data;
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

  // Get ticket by ID
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
      const token = getToken();
      const response = await fetch(`http://10.30.245.243:5000/api/tickets/${ticketId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all tickets (admin)
  getAllTickets: async (status = null, limit = 50) => {
    try {
      const token = getToken();
      const url = status ? `/tickets?status=${status}&limit=${limit}` : `/tickets?limit=${limit}`;
      const response = await fetch(`http://10.30.245.243:5000/api${url}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      return data;
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
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found');
      return { success: false, error: 'No authentication token' };
    }

    console.log('📞 Calling next ticket for counter:', counterId);
    
    const response = await fetch('http://10.30.245.243:5000/api/employee/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ counterId })
    });
    
    const data = await response.json();
    console.log('📨 Response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error calling next ticket:', error);
    return { success: false, error: error.message };
  }
},

  // Complete ticket (employee)
  completeTicket: async (ticketId) => {
    try {
      const token = getToken();
      const response = await fetch('http://10.30.245.243:5000/api/employee/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ ticketId })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error completing ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Start serving ticket (employee)
  // frontend/src/services/ticketService.js

// Start serving ticket (employee) - VERSION CORRIGÉE
startServing: async (ticketId) => {
  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (!token) {
      return { success: false, error: 'No token' };
    }

    console.log('▶️ Start serving ticket:', ticketId);
    
    const response = await fetch('http://10.30.245.243:5000/api/employee/start-serving', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ticketId })
    });
    
    const data = await response.json();
    console.log('✅ Start serving response:', data);
    return data;
  } catch (error) {
    console.error('Error starting service:', error);
    return { success: false, error: error.message };
  }
},

  // Get employee dashboard
  getEmployeeDashboard: async () => {
    try {
      const token = getToken();
      const response = await fetch('http://10.30.245.243:5000/api/employee/dashboard', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting employee dashboard:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current ticket for counter
  getCurrentTicket: async (counterId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://10.30.245.243:5000/api/employee/ticket/current?counterId=${counterId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting current ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // ⚠️ VERSION CORRIGÉE DE getEmployeeCounter ⚠️
  getEmployeeCounter: async (employeeId) => {
    try {
      const token = getToken();
      
      console.log('📡 Token présent:', token ? 'OUI' : 'NON');
      
      if (!token) {
        console.error('❌ PAS DE TOKEN - Reconnectez-vous');
        return { success: false, error: 'No token' };
      }

      const response = await fetch(`http://10.30.245.243:5000/api/employee/counter/${employeeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📥 Réponse compteur:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur compteur:', error);
      return { success: false, error: error.message };
    }
  },

  // Transfer ticket (admin)
  transferTicket: async (ticketId, newServiceCode, reason = '') => {
    try {
      const token = getToken();
      const response = await fetch('http://10.30.245.243:5000/api/tickets/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ticketId,
          newServiceCode,
          reason
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error transferring ticket:', error);
      return { success: false, error: error.message };
    }
  },

  // Prioritize ticket (admin)
  prioritizeTicket: async (ticketId, priority, reason = '') => {
    try {
      const token = getToken();
      const response = await fetch(`http://10.30.245.243:5000/api/priority/prioritize/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          priority,
          reason
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error prioritizing ticket:', error);
      return { success: false, error: error.message };
    }
  }
};

export default ticketService;