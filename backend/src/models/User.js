// models/User.js
const { DataTypes } = require('sequelize');
const database = require('../config/database');
const sequelize = database.sequelize;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'employee', 'client', 'vip_client'), // ADDED 'vip_client'
    defaultValue: 'client'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_vip: {  // ADD THIS
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vip_tier: {  // ADD THIS
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    allowNull: true
  },
  vip_since: {  // ADD THIS
    type: DataTypes.DATE,
    allowNull: true
  },
  vip_code: {  // ADD THIS
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  max_appointments_per_week: {  // ADD THIS
    type: DataTypes.INTEGER,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 10
    }
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;