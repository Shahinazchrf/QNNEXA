import api from './api';

const surveyService = {
  submitSurvey: async (ticketId, rating, comments = '') => {
    try {
      const response = await api.post('/survey/submit', {
        ticket_id: ticketId,
        rating: rating,
        comments: comments
      });
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getSurveyStats: async () => {
    try {
      const response = await api.get('/survey/stats');
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getSurveyByTicket: async (ticketId) => {
    try {
      const response = await api.get(`/survey/ticket/${ticketId}`);
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/survey/dashboard');
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default surveyService;