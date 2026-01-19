const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticket_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show', 'transferred'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'vip', 'urgent', 'disabled', 'pregnant', 'elderly'),
    defaultValue: 'normal'
  },
  estimated_wait_time: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_vip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'tickets',
  timestamps: true
});

module.exports = Ticket;
