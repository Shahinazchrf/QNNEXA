//fronten/src/services/surveyService.js

import api from './api';

const surveyService = {
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
      throw error;
    }
  },

  getSurveyStats: async () => {
    try {
      const response = await api.get('/survey/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting survey stats:', error);
      throw error;
    }
  },

  getSurveyByTicket: async (ticketId) => {
    try {
      const response = await api.get(`/survey/ticket/${ticketId}`);
      return response.survey;
    } catch (error) {
      console.error('Error getting survey:', error);
      throw error;
    }
  }
};

export default surveyService;