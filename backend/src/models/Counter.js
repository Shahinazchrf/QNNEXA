// models/Counter.js
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
    unique: true,
    validate: {
      min: 1,
      max: 100
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: function() {
      return `Counter ${this.number}`;
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'busy', 'break', 'closed'),
    defaultValue: 'inactive',
    validate: {
      isIn: [['active', 'inactive', 'busy', 'break', 'closed']]
    }
  },
  current_ticket_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the ticket currently being served'
  },
  services: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidServices(value) {
        if (!Array.isArray(value)) {
          throw new Error('Services must be an array');
        }
        // Validate each service code
        const validCodes = ['A', 'W', 'D', 'T', 'L', 'C', 'CD', 'O'];
        value.forEach(code => {
          if (!validCodes.includes(code)) {
            throw new Error(`Invalid service code: ${code}`);
          }
        });
      }
    }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Main Hall'
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
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  // Additional metadata
  opened_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the counter was opened'
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the counter was closed'
  },
agency_id: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'agencies',
    key: 'id'
  },
  comment: 'Agency this counter belongs to'
},
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the counter'
  }
}, {
  tableName: 'counters',
  timestamps: true,
  paranoid: false, // Set to true if you want soft deletes
  indexes: [
    {
      unique: true,
      fields: ['number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['employee_id']
    },
    {
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeCreate: (counter) => {
      if (!counter.name) {
        counter.name = `Counter ${counter.number}`;
      }
    },
    beforeUpdate: (counter) => {
      // If status changes to 'closed', set closed_at
      if (counter.changed('status') && counter.status === 'closed') {
        counter.closed_at = new Date();
      }
      // If status changes from 'closed' to something else, clear closed_at
      if (counter.changed('status') && counter.status !== 'closed' && counter.previous('status') === 'closed') {
        counter.closed_at = null;
      }
    }
  }
});

// ==================== INSTANCE METHODS ====================

/**
 * Check if counter can serve a specific service
 * @param {string} serviceCode - Service code to check
 * @returns {boolean} - True if counter can serve this service
 */
Counter.prototype.canServeService = function(serviceCode) {
  return this.services.includes(serviceCode);
};

/**
 * Add a service to counter's services list
 * @param {string} serviceCode - Service code to add
 */
Counter.prototype.addService = function(serviceCode) {
  if (!this.services.includes(serviceCode)) {
    this.services = [...this.services, serviceCode];
  }
};

/**
 * Remove a service from counter's services list
 * @param {string} serviceCode - Service code to remove
 */
Counter.prototype.removeService = function(serviceCode) {
  this.services = this.services.filter(code => code !== serviceCode);
};

/**
 * Get counter statistics
 * @returns {Promise<Object>} - Counter statistics
 */
Counter.prototype.getStatistics = async function() {
  const { Ticket } = require('./index');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalTickets,
    todayTickets,
    avgServiceTime
  ] = await Promise.all([
    Ticket.count({
      where: { counter_id: this.id }
    }),
    Ticket.count({
      where: {
        counter_id: this.id,
        createdAt: { $gte: today }
      }
    }),
    Ticket.findOne({
      where: {
        counter_id: this.id,
        status: 'completed',
        actual_service_time: { $ne: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('actual_service_time')), 'avg_time']
      ]
    })
  ]);
  
  return {
    total_tickets_served: totalTickets,
    tickets_served_today: todayTickets,
    average_service_time: avgServiceTime?.dataValues?.avg_time?.toFixed(1) || '0',
    efficiency_score: this.calculateEfficiencyScore(),
    services_count: this.services.length
  };
};

/**
 * Calculate efficiency score based on status and activity
 * @returns {number} - Efficiency score (0-100)
 */
Counter.prototype.calculateEfficiencyScore = function() {
  const now = new Date();
  let score = 50; // Base score
  
  // Adjust based on status
  switch(this.status) {
    case 'busy':
      score += 30;
      break;
    case 'active':
      score += 20;
      break;
    case 'break':
      score -= 10;
      break;
    case 'closed':
      score = 0;
      break;
  }
  
  // Adjust based on how long since last activity
  if (this.updatedAt) {
    const minutesSinceUpdate = (now - this.updatedAt) / (1000 * 60);
    if (minutesSinceUpdate > 30) {
      score -= 20;
    } else if (minutesSinceUpdate > 60) {
      score -= 40;
    }
  }
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Assign ticket to counter
 * @param {string} ticketId - Ticket ID to assign
 * @returns {Promise<boolean>} - Success status
 */
Counter.prototype.assignTicket = async function(ticketId) {
  try {
    const { Ticket } = require('./index');
    
    // Check if counter is available
    if (this.status === 'busy' && this.current_ticket_id) {
      throw new Error('Counter is already busy with another ticket');
    }
    
    if (this.status === 'closed' || this.status === 'inactive') {
      throw new Error(`Counter is ${this.status}`);
    }
    
    // Update counter
    this.current_ticket_id = ticketId;
    this.status = 'busy';
    await this.save();
    
    // Update ticket
    const ticket = await Ticket.findByPk(ticketId);
    if (ticket) {
      ticket.counter_id = this.id;
      ticket.status = 'called';
      ticket.called_at = new Date();
      await ticket.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error assigning ticket:', error.message);
    return false;
  }
};

/**
 * Release current ticket
 * @returns {Promise<boolean>} - Success status
 */
Counter.prototype.releaseTicket = async function() {
  try {
    this.current_ticket_id = null;
    
    // If counter has employee, set to active, otherwise inactive
    this.status = this.employee_id ? 'active' : 'inactive';
    
    await this.save();
    return true;
  } catch (error) {
    console.error('Error releasing ticket:', error.message);
    return false;
  }
};

/**
 * Check if counter is available for service
 * @param {string} serviceCode - Optional service code to check
 * @returns {boolean} - Availability status
 */
Counter.prototype.isAvailable = function(serviceCode = null) {
  // Basic availability check
  if (!this.is_active || this.status === 'closed') {
    return false;
  }
  
  // Check if counter can serve the requested service
  if (serviceCode && !this.canServeService(serviceCode)) {
    return false;
  }
  
  // Check if counter is busy
  if (this.status === 'busy' && this.current_ticket_id) {
    return false;
  }
  
  return true;
};

/**
 * Get counter display information
 * @returns {Object} - Display information
 */
Counter.prototype.getDisplayInfo = function() {
  return {
    id: this.id,
    number: this.number,
    name: this.name,
    status: this.status,
    location: this.location,
    services: this.services,
    employee: this.employee_id ? 'Assigned' : 'Unassigned',
    current_ticket: this.current_ticket_id ? 'Busy' : 'Available',
    efficiency: this.calculateEfficiencyScore(),
    last_updated: this.updatedAt
  };
};

// ==================== CLASS METHODS ====================

/**
 * Find counter by number
 * @param {number} number - Counter number
 * @returns {Promise<Counter|null>} - Found counter or null
 */
Counter.findByNumber = async function(number) {
  return await this.findOne({ where: { number } });
};

/**
 * Get all available counters for a service
 * @param {string} serviceCode - Service code
 * @returns {Promise<Array>} - Available counters
 */
Counter.findAvailableForService = async function(serviceCode) {
  return await this.findAll({
    where: {
      is_active: true,
      status: { $in: ['active', 'inactive'] },
      services: { $contains: [serviceCode] }
    },
    order: [['number', 'ASC']]
  });
};

/**
 * Get all busy counters
 * @returns {Promise<Array>} - Busy counters
 */
Counter.findBusyCounters = async function() {
  return await this.findAll({
    where: {
      is_active: true,
      status: 'busy'
    },
    include: ['current_ticket', 'employee']
  });
};

/**
 * Get counter with full details
 * @param {string} counterId - Counter ID
 * @returns {Promise<Counter|null>} - Counter with details
 */
Counter.findWithDetails = async function(counterId) {
  return await this.findByPk(counterId, {
    include: [
      {
        association: 'employee',
        attributes: ['id', 'first_name', 'last_name', 'email', 'role']
      },
      {
        association: 'current_ticket',
        include: ['service']
      },
      {
        association: 'counter_tickets',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }
    ]
  });
};

module.exports = Counter;