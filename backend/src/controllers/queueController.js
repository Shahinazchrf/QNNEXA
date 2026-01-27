const { Ticket, Service, Counter } = require('../models');
const { Op } = require('sequelize');

const queueController = {
  // Generate ticket (public)
  async generateTicket(req, res) {
    try {
      const { serviceCode, customerName, vipCode } = req.body;

      // Validate service
      const service = await Service.findOne({ 
        where: { code: serviceCode, is_active: true } 
      });
      
      if (!service) {
        return res.status(400).json({
          success: false,
          error: 'Service not available'
        });
      }

      // Check VIP code
      const isVip = vipCode ? await validateVipCode(vipCode) : false;
      const priority = isVip ? 'vip' : 'normal';

      // Generate ticket number
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastTicket = await Ticket.findOne({
        where: {
          service_id: service.id,
          createdAt: { [Op.gte]: today }
        },
        order: [['createdAt', 'DESC']]
      });

      let seqNumber = 1;
      if (lastTicket) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) seqNumber = parseInt(match[0]) + 1;
      }

      const ticketNumber = `${serviceCode}${seqNumber.toString().padStart(3, '0')}`;

      // Calculate estimated wait time
      const waitTime = await calculateWaitTime(service.id, priority);

      // Create ticket
      const ticket = await Ticket.create({
        ticket_number: ticketNumber,
        service_id: service.id,
        priority,
        status: 'waiting',
        customer_name: customerName || 'Customer',
        is_vip: isVip,
        estimated_wait_time: waitTime,
        client_id: req.user?.id || null // null for walk-in customers
      });

      // Update WebSocket clients
      if (global.io) {
        global.io.emit('ticket_created', {
          ticket_number: ticketNumber,
          service: service.name,
          priority,
          estimated_wait: waitTime,
          created_at: new Date()
        });
        
        global.io.emit('queue_update', {
          total: await Ticket.count({ where: { status: 'waiting' } }),
          service: serviceCode,
          priority
        });
      }

      res.json({
        success: true,
        ticket: {
          number: ticketNumber,
          service: service.name,
          service_code: service.code,
          priority,
          estimated_wait: waitTime,
          created_at: ticket.createdAt,
          message: `Please proceed to waiting area. Your ticket is ${ticketNumber}`
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get queue status (public)
  async getQueueStatus(req, res) {
    try {
      const { serviceCode } = req.query;

      const where = { status: 'waiting' };
      let service = null;

      if (serviceCode) {
        service = await Service.findOne({ where: { code: serviceCode } });
        if (service) where.service_id = service.id;
      }

      const tickets = await Ticket.findAll({
        where,
        include: [Service],
        order: [
          ['priority', 'DESC'], // VIP first
          ['createdAt', 'ASC']  // Then oldest first
        ]
      });

      // Get active counters
      const activeCounters = await Counter.findAll({
        where: { 
          status: ['active', 'busy'],
          is_active: true 
        },
        include: [{
          model: Ticket,
          as: 'current_ticket',
          include: [Service]
        }]
      });

      res.json({
        success: true,
        data: {
          total_waiting: tickets.length,
          by_priority: {
            vip: tickets.filter(t => t.priority === 'vip').length,
            normal: tickets.filter(t => t.priority === 'normal').length,
            urgent: tickets.filter(t => t.priority === 'urgent').length
          },
          by_service: serviceCode ? null : await getServiceCounts(),
          estimated_wait_times: await calculateAllWaitTimes(),
          next_tickets: tickets.slice(0, 10).map(t => ({
            number: t.ticket_number,
            service: t.Service.name,
            priority: t.priority,
            customer_name: t.customer_name,
            waiting_since: t.createdAt,
            estimated_wait: t.estimated_wait_time
          })),
          active_counters: activeCounters.map(c => ({
            number: c.number,
            status: c.status,
            current_ticket: c.current_ticket ? {
              number: c.current_ticket.ticket_number,
              service: c.current_ticket.Service?.name
            } : null,
            employee: c.employee_id ? 'Available' : 'Unassigned'
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get next ticket (for display screens)
  async getNextDisplayTickets(req, res) {
    try {
      // Get next 3 tickets to be called
      const nextTickets = await Ticket.findAll({
        where: { status: 'waiting' },
        include: [Service],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ],
        limit: 3
      });

      // Get currently serving tickets
      const servingTickets = await Ticket.findAll({
        where: { status: 'serving' },
        include: [Service, Counter],
        limit: 5
      });

      res.json({
        success: true,
        display_data: {
          next_tickets: nextTickets.map(t => ({
            number: t.ticket_number,
            service: t.Service.code,
            priority: t.priority
          })),
          currently_serving: servingTickets.map(t => ({
            number: t.ticket_number,
            service: t.Service.name,
            counter: t.Counter?.number || 'N/A',
            started_at: t.serving_started_at
          })),
          last_called: await getLastCalledTickets(5),
          queue_summary: {
            total_waiting: await Ticket.count({ where: { status: 'waiting' } }),
            avg_wait_time: '15 min', // Simplified
            busiest_service: await getBusiestService()
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Cancel ticket
  async cancelTicket(req, res) {
    try {
      const { ticketNumber, reason } = req.body;

      const ticket = await Ticket.findOne({ 
        where: { ticket_number: ticketNumber } 
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status === 'serving' || ticket.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel ticket with status: ${ticket.status}`
        });
      }

      await ticket.update({
        status: 'cancelled',
        cancellation_reason: reason || 'Customer request',
        cancelled_at: new Date()
      });

      // Notify WebSocket clients
      if (global.io) {
        global.io.emit('ticket_cancelled', {
          ticket_number: ticketNumber,
          reason: reason,
          cancelled_at: new Date()
        });
      }

      res.json({
        success: true,
        message: `Ticket ${ticketNumber} cancelled`,
        ticket: {
          number: ticketNumber,
          status: 'cancelled',
          cancelled_at: new Date()
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Transfer ticket to different service
  async transferTicket(req, res) {
    try {
      const { ticketId, newServiceCode } = req.body;

      const ticket = await Ticket.findByPk(ticketId, {
        include: [Service]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      const newService = await Service.findOne({ 
        where: { code: newServiceCode, is_active: true } 
      });

      if (!newService) {
        return res.status(400).json({
          success: false,
          error: 'New service not available'
        });
      }

      // Generate new ticket number for new service
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastTicket = await Ticket.findOne({
        where: {
          service_id: newService.id,
          createdAt: { [Op.gte]: today }
        },
        order: [['createdAt', 'DESC']]
      });

      let seqNumber = 1;
      if (lastTicket) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) seqNumber = parseInt(match[0]) + 1;
      }

      const newTicketNumber = `${newServiceCode}${seqNumber.toString().padStart(3, '0')}`;

      // Mark old ticket as transferred
      await ticket.update({
        status: 'transferred',
        transferred_at: new Date(),
        transferred_to: newServiceCode
      });

      // Create new ticket
      const newTicket = await Ticket.create({
        ticket_number: newTicketNumber,
        service_id: newService.id,
        priority: ticket.priority,
        status: 'waiting',
        customer_name: ticket.customer_name,
        is_vip: ticket.is_vip,
        estimated_wait_time: await calculateWaitTime(newService.id, ticket.priority),
        client_id: ticket.client_id,
        transferred_from: ticket.ticket_number
      });

      res.json({
        success: true,
        message: `Ticket transferred to ${newService.name}`,
        original_ticket: {
          number: ticket.ticket_number,
          old_service: ticket.Service.name,
          status: 'transferred'
        },
        new_ticket: {
          number: newTicketNumber,
          service: newService.name,
          estimated_wait: newTicket.estimated_wait_time,
          position_in_queue: await getQueuePosition(newTicket.id)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Helper functions
async function validateVipCode(code) {
  // In real app, check against database
  const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM', 'VIP2024'];
  return validCodes.includes(code.toUpperCase());
}

async function calculateWaitTime(serviceId, priority) {
  const waitingCount = await Ticket.count({
    where: { 
      service_id: serviceId,
      status: 'waiting'
    }
  });

  const service = await Service.findByPk(serviceId);
  const baseTime = service?.estimated_time || 15;

  let waitTime = waitingCount * baseTime;
  
  // Priority adjustments
  if (priority === 'vip') waitTime = Math.max(5, waitTime * 0.5);
  if (priority === 'urgent') waitTime = Math.max(2, waitTime * 0.3);
  
  return Math.ceil(waitTime);
}

async function calculateAllWaitTimes() {
  const services = await Service.findAll({ where: { is_active: true } });
  const waitTimes = {};

  for (const service of services) {
    const waitingCount = await Ticket.count({
      where: { 
        service_id: service.id,
        status: 'waiting'
      }
    });
    
    waitTimes[service.code] = {
      min: Math.ceil(waitingCount * service.estimated_time * 0.8),
      max: Math.ceil(waitingCount * service.estimated_time * 1.2),
      average: waitingCount * service.estimated_time
    };
  }

  return waitTimes;
}

async function getServiceCounts() {
  const services = await Service.findAll({ 
    where: { is_active: true },
    include: [{
      model: Ticket,
      as: 'tickets',
      where: { status: 'waiting' },
      required: false
    }]
  });

  return services.map(service => ({
    service: service.code,
    name: service.name,
    waiting: service.tickets?.length || 0,
    estimated_time: service.estimated_time
  }));
}

async function getLastCalledTickets(limit = 5) {
  const tickets = await Ticket.findAll({
    where: { 
      status: ['called', 'serving'],
      called_at: { [Op.not]: null }
    },
    include: [Service, Counter],
    order: [['called_at', 'DESC']],
    limit
  });

  return tickets.map(t => ({
    number: t.ticket_number,
    service: t.Service.name,
    counter: t.Counter?.number || 'N/A',
    called_at: t.called_at,
    waiting_time: t.called_at ? 
      Math.floor((t.called_at - t.createdAt) / 60000) + ' min' : 
      'N/A'
  }));
}

async function getBusiestService() {
  const result = await Ticket.findOne({
    where: { 
      status: 'waiting',
      createdAt: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    },
    include: [Service],
    attributes: [
      'service_id',
      [sequelize.fn('COUNT', 'id'), 'ticket_count']
    ],
    group: ['service_id'],
    order: [[sequelize.fn('COUNT', 'id'), 'DESC']]
  });

  return result ? {
    service: result.Service.code,
    name: result.Service.name,
    waiting_count: result.dataValues.ticket_count
  } : null;
}

async function getQueuePosition(ticketId) {
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) return null;

  const position = await Ticket.count({
    where: {
      service_id: ticket.service_id,
      status: 'waiting',
      createdAt: { [Op.lt]: ticket.createdAt }
    }
  });

  return position + 1; // 1-based position
}

module.exports = queueController;