const { Notification, User } = require('../models');

class NotificationService {
  // Create notification
  async createNotification(userId, type, title, message) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        is_read: false
      });

      // Emit socket event if user is online
      if (global.io) {
        global.io.to(`user_${userId}`).emit('new_notification', {
          id: notification.id,
          type,
          title,
          message,
          created_at: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification creation failed:', error);
      return null;
    }
  }

  // Notify ticket creation
  async notifyTicketCreated(ticketData) {
    // Notify all online employees
    if (global.io) {
      global.io.emit('ticket_created', {
        ticket_number: ticketData.ticket_number,
        service: ticketData.service_name,
        priority: ticketData.priority,
        created_at: new Date()
      });
    }

    // Create notification for admins
    const admins = await User.findAll({
      where: { role: ['admin', 'super_admin'], is_active: true }
    });

    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'ticket_created',
        'New Ticket Generated',
        `Ticket ${ticketData.ticket_number} created for ${ticketData.service_name}`
      );
    }
  }

  // Notify ticket called
  async notifyTicketCalled(ticketData, counterNumber) {
    // Broadcast to display screens
    if (global.io) {
      global.io.emit('ticket_called', {
        ticket_number: ticketData.ticket_number,
        counter: counterNumber,
        service: ticketData.service_name,
        called_at: new Date()
      });
    }

    // Create notification for specific employee if assigned
    if (ticketData.employee_id) {
      await this.createNotification(
        ticketData.employee_id,
        'ticket_called',
        'Ticket Assigned to You',
        `Ticket ${ticketData.ticket_number} has been assigned to your counter`
      );
    }
  }

  // Notify ticket completed
  async notifyTicketCompleted(ticketData) {
    if (global.io) {
      global.io.emit('ticket_completed', {
        ticket_number: ticketData.ticket_number,
        service: ticketData.service_name,
        completed_at: new Date()
      });
    }

    // Notify client if they have an account
    if (ticketData.client_id) {
      await this.createNotification(
        ticketData.client_id,
        'ticket_completed',
        'Service Completed',
        `Your service for ticket ${ticketData.ticket_number} has been completed`
      );
    }
  }

  // Notify VIP selection
  async notifyVIPSelected(vipData) {
    if (global.io) {
      global.io.emit('vip_selected', {
        ticket_number: vipData.ticket_number,
        vip_code: vipData.vip_code,
        priority: 'vip'
      });
    }

    // Notify admins about VIP
    const admins = await User.findAll({
      where: { role: ['admin', 'super_admin'], is_active: true }
    });

    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        'vip_selected',
        'VIP Client in Queue',
        `VIP ticket ${vipData.ticket_number} with code ${vipData.vip_code}`
      );
    }
  }

  // Send queue update
  async sendQueueUpdate(queueStats) {
    if (global.io) {
      global.io.emit('queue_update', {
        total_waiting: queueStats.total,
        vip_waiting: queueStats.vip,
        avg_wait_time: queueStats.avg_wait,
        updated_at: new Date()
      });
    }
  }

  // Request survey feedback
  async requestSurvey(ticketId, clientId) {
    const client = await User.findByPk(clientId);
    if (!client || !client.email) return;

    await this.createNotification(
      clientId,
      'survey_request',
      'Share Your Feedback',
      'How was your experience today? Please rate our service.'
    );
  }

  // Get unread count for user
  async getUnreadCount(userId) {
    return await Notification.count({
      where: { user_id: userId, is_read: false }
    });
  }

  // Mark all as read
  async markAllAsRead(userId) {
    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  }
}

module.exports = new NotificationService();