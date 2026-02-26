const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'code'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  estimated_time: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    field: 'estimated_time'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  max_daily_tickets: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    field: 'max_daily_tickets'
  }
}, {
  tableName: 'services',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Service;