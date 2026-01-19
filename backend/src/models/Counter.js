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
  employee_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'counters',
  timestamps: true
});

module.exports = Counter;
