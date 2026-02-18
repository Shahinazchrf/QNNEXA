const { Ticket, Service, Counter } = require('../models');
const { Op, sequelize } = require('sequelize');

const queueController = {
  // Generate ticket (public)
  async generateTicket(req, res) {
    try {
      const { serviceCode, customerName, vipCode } = req.body;

      // Validate service - FIXED: use 'name' instead of 'code'
      const service = await Service.findOne({ 
        where: { name: serviceCode, is_active: true } 
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
        client_id: req.user?.id || null
      });

      // Notify clients
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
          service_code: service.name,
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
        // FIXED: use 'name' instead of 'code'
        service = await Service.findOne({ where: { name: serviceCode } });
        if (service) where.service_id = service.id;
      }

      const tickets = await Ticket.findAll({
        where,
        include: [{ model: Service, as: 'ticketService' }], // FIXED: use correct alias
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ]
      });

      // Active counters
      const activeCounters = await Counter.findAll({
        where: { 
          status: ['active', 'busy'],
          is_active: true 
        },
        include: [{
          model: Ticket,
          as: 'currentTicket', // FIXED: use correct alias
          include: [{ model: Service, as: 'ticketService' }] // FIXED: use correct alias
        }]
      });

      res.json({
        success: true,
        data: {
          total_waiting: tickets.length,
          by_priority: {
            vip: tickets.filter(t => t.priority === 'vip').length,
            normal: tickets.filter(t => t.priority === 'normal').length
          },
          by_service: serviceCode ? null : await getServiceCounts(),
          estimated_wait_times: await calculateAllWaitTimes(),
          next_tickets: tickets.slice(0, 10).map(t => ({
            number: t.ticket_number,
            service: t.ticketService?.name, // FIXED: use name instead of code
            priority: t.priority,
            customer_name: t.customer_name,
            waiting_since: t.createdAt,
            estimated_wait: t.estimated_wait_time
          })),
          active_counters: activeCounters.map(c => ({
            number: c.number,
            status: c.status,
            current_ticket: c.currentTicket ? {
              number: c.currentTicket.ticket_number,
              service: c.currentTicket.ticketService?.name // FIXED: use name instead of code
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

  // Transfer ticket
  async transferTicket(req, res) {
    try {
      const { ticketId, newServiceCode } = req.body;

      const ticket = await Ticket.findByPk(ticketId, {
        include: [{ model: Service, as: 'ticketService' }] // FIXED: use correct alias
      });

      if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

      // FIXED: use 'name' instead of 'code'
      const newService = await Service.findOne({ where: { name: newServiceCode, is_active: true } });
      if (!newService) return res.status(400).json({ success: false, error: 'New service not available' });

      // Generate new ticket number
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastTicket = await Ticket.findOne({
        where: { service_id: newService.id, createdAt: { [Op.gte]: today } },
        order: [['createdAt', 'DESC']]
      });

      let seqNumber = 1;
      if (lastTicket) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) seqNumber = parseInt(match[0]) + 1;
      }

      const newTicketNumber = `${newServiceCode}${seqNumber.toString().padStart(3, '0')}`;

      // Mark old ticket as transferred
      await ticket.update({ status: 'transferred', transferred_at: new Date(), transferred_to: newServiceCode });

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
          old_service: ticket.ticketService?.name, // FIXED: use name instead of code
          status: 'transferred'
        },
        new_ticket: {
          number: newTicketNumber,
          service: newService.name,
          estimated_wait: newTicket.estimated_wait_time
        }
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// Helper functions
async function validateVipCode(code) {
  const validCodes = ['VIP001','VIP002','VIPGOLD','VIPPLATINUM','VIP2024'];
  return validCodes.includes(code.toUpperCase());
}

async function calculateWaitTime(serviceId, priority) {
  const waitingCount = await Ticket.count({ where: { service_id: serviceId, status: 'waiting' } });
  const service = await Service.findByPk(serviceId);
  const baseTime = service?.estimated_time || 15;

  let waitTime = waitingCount * baseTime;
  if (priority === 'vip') waitTime = Math.max(5, waitTime * 0.5);

  return Math.ceil(waitTime);
}

async function calculateAllWaitTimes() {
  const services = await Service.findAll({ where: { is_active: true } });
  const waitTimes = {};
  for (const service of services) {
    const waitingCount = await Ticket.count({ where: { service_id: service.id, status: 'waiting' } });
    waitTimes[service.name] = { // FIXED: use name instead of code
      min: Math.ceil(waitingCount * service.estimated_time * 0.8),
      max: Math.ceil(waitingCount * service.estimated_time),
      average: waitingCount * service.estimated_time
    };
  }
  return waitTimes;
}

async function getServiceCounts() {
  const services = await Service.findAll({
    where: { is_active: true },
    include: [{ model: Ticket, as: 'serviceTickets', where: { status: 'waiting' }, required: false }] // FIXED: use correct alias
  });

  return services.map(s => ({
    service: s.name, // FIXED: use name instead of code
    name: s.name,
    waiting: s.serviceTickets?.length || 0,
    estimated_time: s.estimated_time
  }));
}

module.exports = queueController;