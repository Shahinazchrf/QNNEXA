const { Notification, User } = require('../models');
const { Op } = require('sequelize');

const notificationController = {
  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { unreadOnly = false, limit = 50 } = req.query;

      const where = { user_id: userId };
      if (unreadOnly === 'true') {
        where.is_read = false;
      }

      const notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        notifications,
        unread_count: await Notification.count({ 
          where: { user_id: userId, is_read: false } 
        })
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      await notification.update({ is_read: true });

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Create notification (admin/employee)
  async createNotification(req, res) {
    try {
      const { userId, type, title, message } = req.body;

      // Validate type
      const validTypes = ['ticket_created', 'ticket_called', 'ticket_completed', 
                         'reminder', 'vip_selected', 'queue_update', 'survey_request'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid notification type'
        });
      }

      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        is_read: false
      });

      res.status(201).json({
        success: true,
        message: 'Notification created',
        notification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;

      const [total, unread, todayCount, byType] = await Promise.all([
        Notification.count({ where: { user_id: userId } }),
        Notification.count({ where: { user_id: userId, is_read: false } }),
        Notification.count({
          where: {
            user_id: userId,
            createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        Notification.findAll({
          where: { user_id: userId },
          attributes: [
            'type',
            [sequelize.fn('COUNT', 'id'), 'count']
          ],
          group: ['type']
        })
      ]);

      res.json({
        success: true,
        stats: {
          total_notifications: total,
          unread_notifications: unread,
          notifications_today: todayCount,
          by_type: byType.map(item => ({
            type: item.dataValues.type,
            count: item.dataValues.count
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = notificationController;