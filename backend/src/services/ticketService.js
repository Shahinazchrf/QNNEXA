const { Ticket, Service, Counter, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class TicketService {
  /**
   * Generate ticket number with prefix
   */
  async generateTicketNumber(serviceCode, isVIP = false, isAppointment = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const service = await Service.findOne({ where: { code: serviceCode } });
    if (!service) throw new Error('Service not found');

    // Define prefix based on ticket type
    let prefix;
    if (isAppointment) {
      prefix = `APP${serviceCode}`;
    } else if (isVIP) {
      prefix = `VIP${serviceCode}`;
    } else {
      prefix = serviceCode;
    }

    // Find last ticket for this service today
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        ticket_number: { [Op.like]: `${prefix}%` },
        createdAt: { [Op.between]: [today, tomorrow] }
      },
      order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) sequence = parseInt(match[0]) + 1;
    }

    return `${prefix}${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Create normal ticket
   */
  async createNormalTicket(serviceCode, clientId = null, customerName = 'Customer') {
    const transaction = await sequelize.transaction();
    
    try {
      const service = await Service.findOne({ 
        where: { code: serviceCode, is_active: true } 
      });
      
      if (!service) {
        throw new Error('Service not available');
      }

      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber(serviceCode, false, false);
      
      // Calculate estimated wait time
      const estimatedWait = await this.calculateEstimatedWait(service.id, 'normal');
      
      // Create ticket
      const ticket = await Ticket.create({
        ticket_number: ticketNumber,
        service_id: service.id,
        priority: 'normal',
        status: 'waiting',
        client_id: clientId,
        customer_name: customerName,
        is_vip: false,
        is_appointment: false,
        estimated_wait_time: estimatedWait
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          service: service.name,
          priority: 'normal',
          is_vip: false,
          estimated_wait: estimatedWait,
          position: await this.getTicketPosition(ticket.id)
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create VIP ticket or appointment
   */
  async createVIPTicket(serviceCode, clientId, options = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        isAppointment = false,
        appointmentTime = null,
        vipCode = null,
        customerName = 'VIP Client'
      } = options;

      const service = await Service.findOne({ 
        where: { code: serviceCode, is_active: true } 
      });
      
      if (!service) {
        throw new Error('Service not available');
      }

      // Validate appointment time if it's an appointment
      if (isAppointment && appointmentTime) {
        const appointmentDate = new Date(appointmentTime);
        const now = new Date();
        
        if (appointmentDate <= now) {
          throw new Error('Appointment time must be in the future');
        }
        
        // Check if appointment slot is available
        const existingAppointment = await Ticket.findOne({
          where: {
            service_id: service.id,
            is_appointment: true,
            appointment_time: {
              [Op.between]: [
                new Date(appointmentDate.getTime() - 30 * 60000),
                new Date(appointmentDate.getTime() + 30 * 60000)
              ]
            },
            status: { [Op.in]: ['waiting', 'called'] }
          }
        });

        if (existingAppointment) {
          throw new Error('Time slot already booked');
        }
      }

      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber(serviceCode, true, isAppointment);
      
      // VIP tickets get priority wait time
      const estimatedWait = isAppointment ? 0 : await this.calculateEstimatedWait(service.id, 'vip');
      
      // Create ticket
      const ticket = await Ticket.create({
        ticket_number: ticketNumber,
        service_id: service.id,
        priority: 'vip',
        status: 'waiting',
        client_id: clientId,
        customer_name: customerName,
        is_vip: true,
        is_appointment: isAppointment,
        appointment_time: isAppointment ? appointmentTime : null,
        vip_code_used: vipCode,
        estimated_wait_time: estimatedWait
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          service: service.name,
          priority: 'vip',
          is_vip: true,
          is_appointment: isAppointment,
          appointment_time: isAppointment ? appointmentTime : null,
          estimated_wait: estimatedWait
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Calculate estimated wait time based on queue
   */
  async calculateEstimatedWait(serviceId, priority) {
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
        estimatedTime = Math.max(5, estimatedTime * 0.3); // 70% faster for VIP
        break;
      case 'urgent':
        estimatedTime = Math.max(2, estimatedTime * 0.2);
        break;
      case 'disabled':
      case 'elderly':
      case 'pregnant':
        estimatedTime = Math.max(3, estimatedTime * 0.4);
        break;
    }

    return Math.ceil(estimatedTime);
  }

  /**
   * Get next ticket for counter with VIP priority
   */
  async getNextTicketForCounter(counterId) {
    const counter = await Counter.findByPk(counterId);
    if (!counter) throw new Error('Counter not found');

    // Check counter services
    const counterServices = counter.services || [];

    // Get service IDs for counter's services
    const services = await Service.findAll({
      where: { code: { [Op.in]: counterServices } }
    });
    const serviceIds = services.map(s => s.id);

    // Priority order: VIP Appointments > VIP > Urgent > Special > Normal
    const ticket = await Ticket.findOne({
      where: {
        status: 'waiting',
        service_id: { [Op.in]: serviceIds }
      },
      order: [
        // 1. VIP Appointments first (by appointment time)
        ['is_appointment', 'DESC'],
        ['appointment_time', 'ASC'],
        // 2. VIP priority
        ['is_vip', 'DESC'],
        // 3. Other priorities
        ['priority', 'DESC'],
        // 4. Oldest first within same priority
        ['createdAt', 'ASC']
      ],
      include: [
        { model: Service, as: 'service' },
        { model: User, as: 'client', attributes: ['id', 'first_name', 'last_name', 'phone'] }
      ]
    });

    return ticket;
  }

  /**
   * Get ticket position in queue
   */
  async getTicketPosition(ticketId) {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket || ticket.status !== 'waiting') return null;

    // Count tickets with higher priority or earlier creation time
    const position = await Ticket.count({
      where: {
        service_id: ticket.service_id,
        status: 'waiting',
        [Op.or]: [
          // Higher priority
          { priority: { [Op.gt]: ticket.priority } },
          // Same priority but created earlier
          {
            priority: ticket.priority,
            createdAt: { [Op.lt]: ticket.createdAt }
          }
        ]
      }
    });

    return position + 1;
  }

  /**
   * Mark missed tickets (automatic cleanup)
   */
  async markMissedTickets() {
    try {
      const timeoutMinutes = 5; // 5 minutes timeout
      const timeoutMilliseconds = timeoutMinutes * 60 * 1000;
      
      const cutoffTime = new Date(Date.now() - timeoutMilliseconds);
      
      // Find tickets that were called but not served for > 5 minutes
      const missedTickets = await Ticket.findAll({
        where: {
          status: 'called',
          called_at: {
            [Op.lt]: cutoffTime
          }
        }
      });
      
      const results = [];
      
      for (const ticket of missedTickets) {
        // Mark ticket as missed
        await ticket.update({
          status: 'missed',
          missed_at: new Date()
        });
        
        // Release the counter if it was assigned
        if (ticket.counter_id) {
          const counter = await Counter.findByPk(ticket.counter_id);
          if (counter) {
            await counter.update({
              status: 'active',
              current_ticket_id: null
            });
          }
        }
        
        results.push({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          called_at: ticket.called_at,
          marked_missed_at: new Date()
        });
      }
      
      return {
        count: results.length,
        tickets: results
      };
    } catch (error) {
      console.error('Error marking missed tickets:', error);
      return { error: error.message };
    }
  }

  /**
   * Prioritize or reassign tickets (Admin function)
   */
  async prioritizeTicket(ticketId, newPriority) {
    const validPriorities = ['normal', 'vip', 'urgent', 'disabled', 'elderly', 'pregnant'];
    
    if (!validPriorities.includes(newPriority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.status !== 'waiting') {
      throw new Error(`Cannot change priority for ticket with status: ${ticket.status}`);
    }

    await ticket.update({
      priority: newPriority,
      is_vip: newPriority === 'vip'
    });

    return {
      success: true,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        new_priority: newPriority,
        is_vip: newPriority === 'vip'
      }
    };
  }

  /**
   * Reassign ticket to different service
   */
  async reassignTicket(ticketId, newServiceCode) {
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

      // Generate new ticket number
      const isVIP = ticket.priority === 'vip';
      const isAppointment = ticket.is_appointment;
      const newTicketNumber = await this.generateTicketNumber(newServiceCode, isVIP, isAppointment);

      // Update old ticket as transferred
      await ticket.update({
        status: 'transferred',
        transferred_from: ticket.ticket_number,
        notes: `Transferred to ${newServiceCode}`,
        transferred_at: new Date()
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
        is_appointment: ticket.is_appointment,
        appointment_time: ticket.appointment_time,
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

  /**
   * Get queue statistics
   */
  async getQueueStats(serviceCode = null) {
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
        ['priority', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });

    const stats = {
      total_waiting: tickets.length,
      by_priority: {
        vip: tickets.filter(t => t.priority === 'vip').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        special: tickets.filter(t => ['disabled', 'elderly', 'pregnant'].includes(t.priority)).length,
        normal: tickets.filter(t => t.priority === 'normal').length
      },
      by_type: {
        appointments: tickets.filter(t => t.is_appointment).length,
        vip: tickets.filter(t => t.is_vip && !t.is_appointment).length,
        normal: tickets.filter(t => !t.is_vip && !t.is_appointment).length
      },
      next_tickets: tickets.slice(0, 5).map(t => ({
        number: t.ticket_number,
        service: t.Service?.name,
        priority: t.priority,
        is_vip: t.is_vip,
        is_appointment: t.is_appointment,
        waiting_since: t.createdAt
      }))
    };

    return stats;
  }
}

module.exports = new TicketService();