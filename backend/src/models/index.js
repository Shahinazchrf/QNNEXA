// Import sequelize from database config
const database = require('../config/database');
const sequelize = database.sequelize;
const { DataTypes } = require('sequelize');

// Define User model
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
    type: DataTypes.ENUM('super_admin', 'admin', 'employee', 'client'),
    defaultValue: 'client'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Define Service model
const Service = sequelize.define('Service', {
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
  max_daily_tickets: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  }
}, {
  tableName: 'services',
  timestamps: true
});

// Define Ticket model
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
  }
}, {
  tableName: 'tickets',
  timestamps: true
});

// Define Counter model
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
  }
}, {
  tableName: 'counters',
  timestamps: true
});

// Define relationships
User.hasMany(Ticket, {
  foreignKey: 'client_id',
  as: 'tickets'
});
Ticket.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'client'
});

Service.hasMany(Ticket, {
  foreignKey: 'service_id',
  as: 'tickets'
});
Ticket.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

Counter.hasMany(Ticket, {
  foreignKey: 'counter_id',
  as: 'tickets'
});
Ticket.belongsTo(Counter, {
  foreignKey: 'counter_id',
  as: 'counter'
});

User.hasOne(Counter, {
  foreignKey: 'employee_id',
  as: 'counter'
});
Counter.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Export models
module.exports = {
  User,
  Service,
  Ticket,
  Counter
};
