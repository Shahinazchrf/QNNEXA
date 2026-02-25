// frontend/src/services/notificationService.js 

import api from './api';
import authService from './authService';

const notificationService = {
  // Récupérer toutes les notifications de l'utilisateur
  getUserNotifications: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/notifications', token);
      return response;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Récupérer les notifications non lues
  getUnreadNotifications: async () => {
    try {
      const token = authService.getToken();
      const response = await api.getAuth('/notifications/unread', token);
      return response;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (notificationId) => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth(`/notifications/${notificationId}/read`, {}, token);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    try {
      const token = authService.getToken();
      const response = await api.putAuth('/notifications/read-all', {}, token);
      return response;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Créer une notification (pour les tests)
  createTestNotification: async (ticketData) => {
    // Simuler une notification (à remplacer par un vrai appel API)
    return {
      success: true,
      notification: {
        id: Date.now(),
        title: ticketData.title || 'Ticket Update',
        message: ticketData.message || `Your ticket ${ticketData.number} is ready`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        isRead: false
      }
    };
  }
};

export default notificationService;