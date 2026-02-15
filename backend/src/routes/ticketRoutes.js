const { Ticket, Service, Counter, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class TicketsService {
  // Generate ticket number
  async generateTicketNumber(serviceCode, date = new Date()) {
    date.setHours(0, 0, 0, 0);
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const service = await Service.findOne({ where: { code: serviceCode } });
    if (!service) throw new Error('Service not found');

    // Find last ticket for this service today
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        createdAt: { [Op.between]: [date, tomorrow] }
      },
      order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) sequence = parseInt(match[0]) + 1;
    }

    return `${serviceCode}${sequence.toString().padStart(3, '0')}`;
  }

  // Calculate estimated wait time
  async calculateEstimatedWait(serviceId, priority = 'normal') {
    const waitingTickets = await Ticket.count({
      where: { 
        service_id: serviceId,
        status: 'waiting'
      }
    });

    const service = await Service.findByPk(serviceId);
    const baseTime = service?.estimated_time || 15;

    let estimatedTime = waitingTickets * baseTime;

    // Priority adjustments
    switch (priority) {
      case 'vip':
        estimatedTime = Math.max(5, estimatedTime * 0.5);
        break;
      case 'normal':
        estimatedTime = Math.max(2, estimatedTime * 0.3);
        break;
      case 'disabled':
      case 'elderly':
      case 'pregnant':
        estimatedTime = Math.max(3, estimatedTime * 0.4);
        break;
    }

    return Math.ceil(estimatedTime);
  }

  // Create ticket
  async createTicket(serviceCode, customerName = 'Customer', vipCode = null, clientId = null) {
    const service = await Service.findOne({ 
      where: { code: serviceCode, is_active: true } 
    });

    if (!service) {
      throw new Error('Service not available');
    }

    // Validate VIP code
    const isVIP = vipCode ? await this.validateVIPCode(vipCode) : false;
    const priority = isVIP ? 'vip' : 'normal';

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(serviceCode);
    
    // Calculate wait time
    const estimatedWait = await this.calculateEstimatedWait(service.id, priority);

    // Create ticket
    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      priority,
      status: 'waiting',
      customer_name: customerName,
      client_id: clientId,
      is_vip: isVIP,
      estimated_wait_time: estimatedWait
    });

    // Load with service data
    const ticketWithService = await Ticket.findByPk(ticket.id, {
      include: [Service]
    });

    return {
      success: true,
      ticket: {
        id: ticketWithService.id,
        number: ticketWithService.ticket_number,
        service: ticketWithService.Service.name,
        service_code: serviceCode,
        priority,
        customer_name: customerName,
        estimated_wait: estimatedWait,
        created_at: ticketWithService.createdAt
      }
    };
  }

  // Get next ticket for counter
  async getNextTicketForCounter(counterId) {
    const counter = await Counter.findByPk(counterId);
    if (!counter) throw new Error('Counter not found');

    // Check counter services
    const counterServices = counter.services || [];

    // Build query for waiting tickets
    const where = { status: 'waiting' };

    if (counterServices.length > 0) {
      // Get service IDs for counter's services
      const services = await Service.findAll({
        where: { code: { [Op.in]: counterServices } }
      });
      const serviceIds = services.map(s => s.id);
      
      where.service_id = { [Op.in]: serviceIds };
    }

    // Priority order: VIP > normal > special > normal
    const priorityOrder = ['vip', 'normal', 'disabled', 'elderly', 'pregnant', 'normal'];

    for (const priority of priorityOrder) {
      where.priority = priority;
      
      const ticket = await Ticket.findOne({
        where,
        include: [Service],
        order: [['createdAt', 'ASC']]
      });

      if (ticket) return ticket;
    }

    return null;
  }

  // Call ticket to counter
  async callTicketToCounter(ticketId, counterId, employeeId) {
    const transaction = await sequelize.transaction();

    try {
      const ticket = await Ticket.findByPk(ticketId, { transaction });
      if (!ticket) throw new Error('Ticket not found');

      if (ticket.status !== 'waiting') {
        throw new Error(`Ticket is not waiting (current status: ${ticket.status})`);
      }

      const counter = await Counter.findByPk(counterId, { transaction });
      if (!counter) throw new Error('Counter not found');

      if (counter.status === 'busy' && counter.current_ticket_id) {
        throw new Error('Counter is already busy with another ticket');
      }

      // Update ticket
      await ticket.update({
        status: 'called',
        counter_id: counterId,
        employee_id: employeeId,
        called_at: new Date()
      }, { transaction });

      // Update counter
      await counter.update({
        status: 'busy',
        current_ticket_id: ticketId,
        employee_id: employeeId
      }, { transaction });

      await transaction.commit();

      // Return ticket with details
      const ticketWithDetails = await Ticket.findByPk(ticketId, {
        include: [Service, Counter]
      });

      return {
        success: true,
        ticket: ticketWithDetails
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Start serving ticket
  async startServingTicket(ticketId) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.status !== 'called') {
      throw new Error('Ticket must be called first');
    }

    await ticket.update({
      status: 'serving',
      serving_started_at: new Date()
    });

    return ticket;
  }

  // Complete ticket
  async completeTicket(ticketId, notes = null) {
    const transaction = await sequelize.transaction();

    try {
      const ticket = await Ticket.findByPk(ticketId, {
        include: [Counter],
        transaction
      });

      if (!ticket) throw new Error('Ticket not found');

      if (ticket.status !== 'serving') {
        throw new Error('Ticket is not being served');
      }

      // Calculate actual times
      const now = new Date();
      const waitTime = ticket.called_at ? 
        Math.floor((ticket.called_at - ticket.createdAt) / 60000) : 0;
      const serviceTime = ticket.serving_started_at ? 
        Math.floor((now - ticket.serving_started_at) / 60000) : 0;
      const totalTime = Math.floor((now - ticket.createdAt) / 60000);

      // Update ticket
      await ticket.update({
        status: 'completed',
        completed_at: now,
        actual_wait_time: waitTime,
        actual_service_time: serviceTime,
        total_time: totalTime,
        notes
      }, { transaction });

      // Update counter if assigned
      if (ticket.counter_id && ticket.Counter) {
        await ticket.Counter.update({
          status: 'active',
          current_ticket_id: null
        }, { transaction });
      }

      await transaction.commit();

      return {
        success: true,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          wait_time: waitTime,
          service_time: serviceTime,
          total_time: totalTime,
          completed_at: now
        }
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Cancel ticket
  async cancelTicket(ticketId, reason = 'Customer request') {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.status === 'serving' || ticket.status === 'completed') {
      throw new Error(`Cannot cancel ticket with status: ${ticket.status}`);
    }

    await ticket.update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date()
    });

    return ticket;
  }

  // Transfer ticket to another service
  async transferTicket(ticketId, newServiceCode) {
    const transaction = await sequelize.transaction();

    try {
      const ticket = await Ticket.findByPk(ticketId, {
        include: [Service],
        transaction
      });

      if (!ticket) throw new Error('Ticket not found');

      const newService = await Service.findOne({
        where: { code: newServiceCode, is_active: true },
        transaction
      });

      if (!newService) throw new Error('New service not available');

      // Generate new ticket number for new service
      const newTicketNumber = await this.generateTicketNumber(newServiceCode);

      // Mark old ticket as transferred
      await ticket.update({
        status: 'transferred',
        transferred_at: new Date(),
        transferred_to: newServiceCode
      }, { transaction });

      // Calculate wait time for new service
      const estimatedWait = await this.calculateEstimatedWait(newService.id, ticket.priority);

      // Create new ticket
      const newTicket = await Ticket.create({
        ticket_number: newTicketNumber,
        service_id: newService.id,
        priority: ticket.priority,
        status: 'waiting',
        customer_name: ticket.customer_name,
        client_id: ticket.client_id,
        is_vip: ticket.is_vip,
        estimated_wait_time: estimatedWait,
        transferred_from: ticket.ticket_number
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        original_ticket: ticket,
        new_ticket: newTicket
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Get queue status
  async getQueueStatus(serviceCode = null) {
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
        ['priority', 'DESC'], // VIP/Urgent first
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

    // Calculate statistics
    const byPriority = {
      vip: tickets.filter(t => t.priority === 'vip').length,
      normal: tickets.filter(t => t.priority === 'normal').length,
      special: tickets.filter(t => ['disabled', 'elderly', 'pregnant'].includes(t.priority)).length,
      normal: tickets.filter(t => t.priority === 'normal').length
    };

    // Calculate estimated wait times
    const estimatedWaits = {};
    if (!serviceCode) {
      const services = await Service.findAll({ where: { is_active: true } });
      for (const svc of services) {
        const waitingCount = await Ticket.count({
          where: { service_id: svc.id, status: 'waiting' }
        });
        estimatedWaits[svc.code] = waitingCount * svc.estimated_time;
      }
    }

    return {
      total_waiting: tickets.length,
      by_priority: byPriority,
      estimated_waits: estimatedWaits,
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
    };
  }

  // Validate VIP code (simplified version)
  async validateVIPCode(code) {
    if (!code) return false;
    
    // In real app, check against database
    const validCodes = ['VIP001', 'VIP002', 'VIP003', 'VIPGOLD', 'VIPPLATINUM', 'VIP2024'];
    return validCodes.includes(code.toUpperCase());
  }

  // Get ticket position in queue
  async getTicketPosition(ticketId) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket || ticket.status !== 'waiting') return null;

    const position = await Ticket.count({
      where: {
        service_id: ticket.service_id,
        status: 'waiting',
        [Op.or]: [
          { priority: { [Op.gt]: ticket.priority } },
          {
            priority: ticket.priority,
            createdAt: { [Op.lt]: ticket.createdAt }
          }
        ]
      }
    });

    return position + 1; // 1-based position
  }
}

module.exports = new TicketsService();