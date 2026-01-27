const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Counter = sequelize.define('Counter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'busy', 'break', 'closed'),
    defaultValue: 'inactive'
  },
  current_ticket_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  services: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // FOREIGN KEY for employee
  employee_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'counters',
  timestamps: true
});

module.exports = Counter;