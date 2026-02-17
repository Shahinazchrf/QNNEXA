// models/Service.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {  // CHANGE FROM 'code' TO 'name'
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimated_time: {
    type: DataTypes.INTEGER,
    defaultValue: 15
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  max_daily_tickets: {  // ADD THIS - from your database
    type: DataTypes.INTEGER,
    defaultValue: 50
  }
}, {
  tableName: 'services',
  timestamps: true
});

module.exports = Service;