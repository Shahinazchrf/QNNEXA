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
    type: DataTypes.ENUM('pending', 'waiting', 'called', 'serving', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'vip', 'urgent', 'disabled', 'elderly', 'pregnant'),
    defaultValue: 'normal'
  },
  estimated_wait_time: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actual_wait_time: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_vip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  called_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  served_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // FOREIGN KEYS (Add these)
  client_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  counter_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'counters',
      key: 'id'
    }
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'tickets',
  timestamps: true
});

module.exports = Ticket;