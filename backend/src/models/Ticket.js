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
    type: DataTypes.ENUM('waiting', 'called', 'serving', 'completed', 'cancelled', 'missed', 'no_show'),
    defaultValue: 'waiting'
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
  actual_service_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Actual service time in minutes'
  },
  is_vip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_appointment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a scheduled appointment'
  },
  appointment_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Scheduled appointment time for VIP clients'
  },
  called_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  serving_started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When service actually started'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  missed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When ticket was marked as missed'
  },
  cancellation_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
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
  },
  has_survey: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vip_code_used: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'VIP code used for priority'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transferred_from: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['ticket_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['service_id']
    },
    {
      fields: ['counter_id']
    },
    {
      fields: ['is_vip']
    },
    {
      fields: ['is_appointment']
    },
    {
      fields: ['appointment_time']
    }
  ]
});

module.exports = Ticket;