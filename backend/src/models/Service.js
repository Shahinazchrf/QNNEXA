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
    validate: {
      is: /^[A-Z]+$/i  // Only allows letters (like 'W', 'A', 'C', etc.)
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: function() {
      return this.code; // Default to code if name not provided
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimated_time: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    validate: {
      min: 1,
      max: 120
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  max_daily_tickets: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    validate: {
      min: 1,
      max: 500
    }
  }
}, {
  tableName: 'services',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['is_active']
    }
  ]
});

// ==================== INSTANCE METHODS ====================

/**
 * Get full service info with statistics
 */
Service.prototype.getStats = async function() {
  const { Ticket } = require('./index');
  const { Op } = require('sequelize');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [
    totalTickets,
    todayTickets,
    waitingTickets,
    completedTickets,
    avgWaitTime
  ] = await Promise.all([
    // Total tickets ever for this service
    Ticket.count({
      where: { service_id: this.id }
    }),
    
    // Tickets today
    Ticket.count({
      where: {
        service_id: this.id,
        createdAt: { [Op.between]: [today, tomorrow] }
      }
    }),
    
    // Currently waiting
    Ticket.count({
      where: {
        service_id: this.id,
        status: 'waiting'
      }
    }),
    
    // Completed today
    Ticket.count({
      where: {
        service_id: this.id,
        status: 'completed',
        completed_at: { [Op.between]: [today, tomorrow] }
      }
    }),
    
    // Average wait time
    Ticket.findOne({
      where: {
        service_id: this.id,
        status: 'completed',
        called_at: { [Op.ne]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.literal('julianday(called_at) - julianday(createdAt)') * 24 * 60), 'avg_wait']
      ]
    })
  ]);
  
  return {
    service_id: this.id,
    code: this.code,
    name: this.name,
    total_tickets_all_time: totalTickets,
    tickets_today: todayTickets,
    waiting_now: waitingTickets,
    completed_today: completedTickets,
    average_wait_time: avgWaitTime?.dataValues?.avg_wait?.toFixed(1) || '0',
    is_active: this.is_active,
    estimated_time: this.estimated_time,
    utilization_rate: this.max_daily_tickets > 0 
      ? ((todayTickets / this.max_daily_tickets) * 100).toFixed(1) + '%'
      : '0%'
  };
};

/**
 * Check if service is available
 */
Service.prototype.isAvailable = function() {
  return this.is_active === true;
};

/**
 * Get current queue position for this service
 */
Service.prototype.getQueuePosition = async function(ticketId) {
  const { Ticket } = require('./index');
  const { Op } = require('sequelize');
  
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket || ticket.service_id !== this.id) {
    return null;
  }
  
  const position = await Ticket.count({
    where: {
      service_id: this.id,
      status: 'waiting',
      createdAt: { [Op.lt]: ticket.createdAt }
    }
  });
  
  return position + 1;
};

/**
 * Get estimated wait time for this service
 */
Service.prototype.getEstimatedWaitTime = async function(priority = 'normal') {
  const { Ticket } = require('./index');
  
  const waitingCount = await Ticket.count({
    where: {
      service_id: this.id,
      status: 'waiting'
    }
  });
  
  let waitTime = waitingCount * (this.estimated_time || 15);
  
  // Priority adjustments
  switch(priority) {
    case 'vip':
      waitTime = Math.max(5, waitTime * 0.3);
      break;
    case 'urgent':
      waitTime = Math.max(2, waitTime * 0.2);
      break;
    case 'disabled':
    case 'elderly':
    case 'pregnant':
      waitTime = Math.max(3, waitTime * 0.4);
      break;
  }
  
  return Math.ceil(waitTime);
};

// ==================== CLASS METHODS ====================

/**
 * Find service by code
 */
Service.findByCode = async function(code) {
  return await this.findOne({ 
    where: { 
      code: code.toUpperCase(),
      is_active: true 
    } 
  });
};

/**
 * Get all active services
 */
Service.getActiveServices = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['code', 'ASC']]
  });
};

/**
 * Get services with waiting tickets
 */
Service.getServicesWithQueue = async function() {
  const { Ticket } = require('./index');
  const { Op } = require('sequelize');
  
  const services = await this.findAll({
    where: { is_active: true },
    include: [{
      model: Ticket,
      as: 'serviceTickets',
      where: { status: 'waiting' },
      required: false,
      separate: true,
      limit: 5
    }]
  });
  
  return services.map(service => ({
    id: service.id,
    code: service.code,
    name: service.name,
    waiting_count: service.serviceTickets?.length || 0,
    estimated_wait: service.estimated_time * (service.serviceTickets?.length || 0),
    next_tickets: service.serviceTickets?.slice(0, 3).map(t => ({
      number: t.ticket_number,
      created_at: t.createdAt
    }))
  }));
};

/**
 * Bulk create services (for seeding)
 */
Service.bulkCreateServices = async function(servicesData) {
  const services = servicesData.map(s => ({
    code: s.code.toUpperCase(),
    name: s.name || s.code,
    description: s.description || null,
    estimated_time: s.estimated_time || 15,
    max_daily_tickets: s.max_daily_tickets || 50,
    is_active: true
  }));
  
  return await this.bulkCreate(services, {
    updateOnDuplicate: ['name', 'description', 'estimated_time', 'max_daily_tickets']
  });
};

module.exports = Service;