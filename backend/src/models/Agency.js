const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Agency = sequelize.define('Agency', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  opening_hours: {
    type: DataTypes.JSON,
    defaultValue: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '16:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: null, close: null }
    }
  },
  services: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Services available at this agency'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  manager_id: {
    type: DataTypes.UUID,
    allowNull: true
    // Foreign key temporarily disabled for sync
  },
  max_counters: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'agencies',
  timestamps: true
});

module.exports = Agency;