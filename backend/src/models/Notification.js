// models/Notification.js
const database = require('../config/database');
const sequelize = database.sequelize;
const { DataTypes } = require('sequelize');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'upcoming_turn',
      'missed_turn',
      'reminder',
      'vip_priority',
      'counter_change',
      'general',
      'info',        // <-- AJOUTÉ
      'warning',     // <-- AJOUTÉ
      'success',     // <-- AJOUTÉ
      'test'         // <-- AJOUTÉ
    ),
    defaultValue: 'upcoming_turn'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('in_app', 'sms', 'email', 'push'),
    defaultValue: 'in_app'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
    defaultValue: 'pending'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;
