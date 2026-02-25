import api from './api';

const surveyService = {
  // Submit survey
  submitSurvey: async (ticketId, rating, comments = '') => {
    try {
      const response = await api.post('/survey/submit', {
        ticket_id: ticketId,
        rating,
        comments
      });
      return response;
    } catch (error) {
      console.error('Error submitting survey:', error);
      return { success: false, error: error.message };
    }
  },

  // Get survey statistics
  getSurveyStats: async () => {
    try {
      const response = await api.get('/survey/stats');
      return response;
    } catch (error) {
      console.error('Error getting survey stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Get survey by ticket ID
  getSurveyByTicket: async (ticketId) => {
    try {
      const response = await api.get(`/survey/ticket/${ticketId}`);
      return response;
    } catch (error) {
      console.error('Error getting survey:', error);
      return { success: false, error: error.message };
    }
  },

  // Get survey dashboard
  getDashboard: async () => {
    try {
      const response = await api.get('/survey/dashboard');
      return response;
    } catch (error) {
      console.error('Error getting survey dashboard:', error);
      return { success: false, error: error.message };
    }
  }
};

export default surveyService;