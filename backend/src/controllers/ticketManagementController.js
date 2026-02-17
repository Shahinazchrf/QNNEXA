const { Ticket, Service, User, Counter } = require('../models');
const { Op } = require('sequelize');

const ticketManagementController = {
  // Create normal ticket and save to database
  async createNormalTicket(req, res) {
    try {
      const { service_code, customer_name } = req.body;

      if (!service_code) {
        return res.status(400).json({
          success: false,
          error: 'Service code is required'
        });
      }

      // Find the service
      const service = await Service.findOne({
        where: { name: service_code, is_active: true }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: `Service ${service_code} not found`
        });
      }

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
      if (lastTicket && lastTicket.ticket_number) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) {
          seqNumber = parseInt(match[0]) + 1;
        }
      }

      const ticketNumber = `${service_code}${seqNumber.toString().padStart(3, '0')}`;

      // Calculate estimated wait time
      const waitingCount = await Ticket.count({
        where: {
          service_id: service.id,
          status: 'waiting'
        }
      });
      const estimatedWait = waitingCount * (service.estimated_time || 15);

      // CREATE AND SAVE TICKET TO DATABASE
      const ticket = await Ticket.create({
        ticket_number: ticketNumber,
        service_id: service.id,
        customer_name: customer_name || 'Customer',
        status: 'waiting',
        priority: 'normal',
        is_vip: false,
        estimated_wait_time: estimatedWait,
        created_at: new Date()
      });

      console.log(`✅ Ticket ${ticketNumber} saved to database with ID: ${ticket.id}`);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: {
          id: ticket.id,
          number: ticket.ticket_number,
          service: service.name,
          status: ticket.status,
          estimated_wait: ticket.estimated_wait_time,
          created_at: ticket.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get ticket status from database
  async getTicketStatus(req, res) {
    try {
      const { ticket_number } = req.query;

      if (!ticket_number) {
        return res.status(400).json({
          success: false,
          error: 'Ticket number is required'
        });
      }

      // FIND TICKET IN DATABASE
      const ticket = await Ticket.findOne({
        where: { ticket_number },
        include: [
          { model: Service, as: 'ticketService' },
          { model: Counter, as: 'ticketCounter' }
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Calculate queue position if waiting
      let position = null;
      if (ticket.status === 'waiting') {
        position = await Ticket.count({
          where: {
            service_id: ticket.service_id,
            status: 'waiting',
            createdAt: { [Op.lt]: ticket.createdAt }
          }
        }) + 1;
      }

      res.json({
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            number: ticket.ticket_number,
            service: ticket.ticketService?.name,
            status: ticket.status,
            priority: ticket.priority,
            is_vip: ticket.is_vip,
            customer_name: ticket.customer_name,
            created_at: ticket.createdAt,
            called_at: ticket.called_at,
            completed_at: ticket.completed_at,
            counter: ticket.ticketCounter?.number
          },
          queue_position: position,
          estimated_wait: ticket.estimated_wait_time
        }
      });

    } catch (error) {
      console.error('❌ Error getting ticket status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Create VIP ticket
  async createVIPTicket(req, res) {
    try {
      const { service_code, customer_name, is_appointment, appointment_time } = req.body;
      const client_id = req.user?.id;

      if (!client_id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user is VIP
      const user = await User.findByPk(client_id);
      if (!user || !user.is_vip) {
        return res.status(403).json({
          success: false,
          error: 'Only VIP clients can create VIP tickets'
        });
      }

      // Find service
      const service = await Service.findOne({
        where: { name: service_code, is_active: true }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: `Service ${service_code} not found`
        });
      }

      // Generate VIP ticket number
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const prefix = is_appointment ? 'APT' : 'VIP';
      const lastTicket = await Ticket.findOne({
        where: {
          ticket_number: { [Op.like]: `${prefix}${service_code}%` },
          createdAt: { [Op.gte]: today }
        },
        order: [['createdAt', 'DESC']]
      });

      let seqNumber = 1;
      if (lastTicket && lastTicket.ticket_number) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) seqNumber = parseInt(match[0]) + 1;
      }

      const ticketNumber = `${prefix}${service_code}${seqNumber.toString().padStart(3, '0')}`;

      // CREATE VIP TICKET IN DATABASE
      const ticket = await Ticket.create({
        ticket_number: ticketNumber,
        service_id: service.id,
        client_id: client_id,
        customer_name: customer_name || user.first_name + ' ' + user.last_name,
        status: 'waiting',
        priority: 'vip',
        is_vip: true,
        is_appointment: is_appointment || false,
        appointment_time: appointment_time || null,
        estimated_wait_time: 5 // VIPs wait less
      });

      console.log(`✅ VIP Ticket ${ticketNumber} saved to database`);

      res.status(201).json({
        success: true,
        message: is_appointment ? 'Appointment created successfully' : 'VIP ticket created successfully',
        data: {
          id: ticket.id,
          number: ticket.ticket_number,
          service: service.name,
          status: ticket.status,
          is_vip: true,
          is_appointment: ticket.is_appointment,
          appointment_time: ticket.appointment_time,
          estimated_wait: ticket.estimated_wait_time,
          created_at: ticket.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Error creating VIP ticket:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Cancel ticket
  async cancelTicket(req, res) {
    try {
      const { ticket_number, reason } = req.body;
      const user_id = req.user?.id;

      const ticket = await Ticket.findOne({
        where: { ticket_number }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Check if user owns this ticket (or is admin)
      if (ticket.client_id && ticket.client_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to cancel this ticket'
        });
      }

      if (ticket.status !== 'waiting') {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel ticket with status: ${ticket.status}`
        });
      }

      // UPDATE TICKET IN DATABASE
      await ticket.update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by customer',
        completed_at: new Date()
      });

      console.log(`✅ Ticket ${ticket_number} cancelled`);

      res.json({
        success: true,
        message: `Ticket ${ticket_number} cancelled successfully`,
        data: {
          number: ticket.ticket_number,
          status: ticket.status,
          cancelled_at: ticket.completed_at
        }
      });

    } catch (error) {
      console.error('❌ Error cancelling ticket:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Admin: Prioritize ticket
  async prioritizeTicket(req, res) {
    try {
      const { ticket_id, priority, reason } = req.body;

      const ticket = await Ticket.findByPk(ticket_id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status !== 'waiting') {
        return res.status(400).json({
          success: false,
          error: `Cannot prioritize ticket with status: ${ticket.status}`
        });
      }

      // UPDATE TICKET PRIORITY IN DATABASE
      await ticket.update({
        priority: priority,
        is_vip: priority === 'vip',
        priority_changed_at: new Date(),
        priority_change_reason: reason,
        notes: ticket.notes ? `${ticket.notes}\nPriority changed to ${priority}: ${reason}` : `Priority changed to ${priority}: ${reason}`
      });

      console.log(`✅ Ticket ${ticket.ticket_number} priority changed to ${priority}`);

      res.json({
        success: true,
        message: `Ticket priority updated to ${priority}`,
        data: {
          id: ticket.id,
          number: ticket.ticket_number,
          priority: ticket.priority,
          is_vip: ticket.is_vip
        }
      });

    } catch (error) {
      console.error('❌ Error prioritizing ticket:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Admin: Reassign ticket
  async reassignTicket(req, res) {
    try {
      const { ticket_id, new_service_code, reason } = req.body;

      const ticket = await Ticket.findByPk(ticket_id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      const newService = await Service.findOne({
        where: { name: new_service_code, is_active: true }
      });

      if (!newService) {
        return res.status(404).json({
          success: false,
          error: `Service ${new_service_code} not found`
        });
      }

      // Generate new ticket number
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
      if (lastTicket && lastTicket.ticket_number) {
        const match = lastTicket.ticket_number.match(/\d+$/);
        if (match) seqNumber = parseInt(match[0]) + 1;
      }

      const newTicketNumber = `${new_service_code}${seqNumber.toString().padStart(3, '0')}`;

      // Mark old ticket as transferred
      await ticket.update({
        status: 'transferred',
        transferred_to: newTicketNumber,
        notes: ticket.notes ? `${ticket.notes}\nTransferred to ${new_service_code}: ${reason}` : `Transferred to ${new_service_code}: ${reason}`
      });

      // CREATE NEW TICKET IN DATABASE
      const newTicket = await Ticket.create({
        ticket_number: newTicketNumber,
        service_id: newService.id,
        client_id: ticket.client_id,
        customer_name: ticket.customer_name,
        status: 'waiting',
        priority: ticket.priority,
        is_vip: ticket.is_vip,
        is_appointment: ticket.is_appointment,
        appointment_time: ticket.appointment_time,
        estimated_wait_time: 15,
        transferred_from: ticket.ticket_number,
        notes: `Transferred from ${ticket.ticket_number}`
      });

      console.log(`✅ Ticket reassigned: ${ticket.ticket_number} → ${newTicketNumber}`);

      res.json({
        success: true,
        message: `Ticket reassigned to ${new_service_code}`,
        data: {
          original_ticket: {
            number: ticket.ticket_number,
            status: ticket.status
          },
          new_ticket: {
            number: newTicket.ticket_number,
            service: newService.name,
            estimated_wait: newTicket.estimated_wait_time
          }
        }
      });

    } catch (error) {
      console.error('❌ Error reassigning ticket:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get queue statistics
  async getQueueStatistics(req, res) {
    try {
      const { service_code } = req.query;

      let where = { status: 'waiting' };
      
      if (service_code) {
        const service = await Service.findOne({ where: { name: service_code } });
        if (service) {
          where.service_id = service.id;
        }
      }

      // GET DATA FROM DATABASE
      const tickets = await Ticket.findAll({
        where,
        include: [{ model: Service, as: 'ticketService' }],
        order: [['createdAt', 'ASC']]
      });

      const totalWaiting = tickets.length;
      const vipCount = tickets.filter(t => t.is_vip).length;
      const normalCount = totalWaiting - vipCount;

      const missedToday = await Ticket.count({
        where: {
          status: 'missed',
          createdAt: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      });

      const completedToday = await Ticket.count({
        where: {
          status: 'completed',
          completed_at: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      });

      res.json({
        success: true,
        data: {
          total_waiting: totalWaiting,
          vip_waiting: vipCount,
          normal_waiting: normalCount,
          missed_today: missedToday,
          completed_today: completedToday,
          next_tickets: tickets.slice(0, 5).map(t => ({
            number: t.ticket_number,
            service: t.ticketService?.name,
            is_vip: t.is_vip,
            waiting_since: t.createdAt
          })),
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error getting queue statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = ticketManagementController;
