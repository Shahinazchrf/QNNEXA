const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  advisor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'advisor_id'
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id'
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_time'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  confirmation_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    defaultValue: 'pending',
    field: 'confirmation_status'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'confirmed_at'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at'
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason'
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  createdAt: 'createdAt',   // ← précise le nom exact
  updatedAt: 'updatedAt'     // ← précise le nom exact
});

module.exports = Appointment;