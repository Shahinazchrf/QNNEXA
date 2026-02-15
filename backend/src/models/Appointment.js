const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

module.exports = Appointment;
