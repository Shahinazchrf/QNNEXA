const { Ticket, Counter, Service, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const employeeController = {
  // Call next ticket
  async callNextTicket(req, res) {
    try {
      const employeeId = req.user.id;
      const counterId = req.body.counterId || req.user.counterId;

      // Find employee's counter
      const counter = await Counter.findByPk(counterId);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      // Check if counter already has active ticket
      if (counter.current_ticket_id) {
        const currentTicket = await Ticket.findByPk(counter.current_ticket_id);
        if (currentTicket && currentTicket.status === 'serving') {
          return res.status(400).json({
            success: false,
            error: 'You already have an active ticket'
          });
        }
      }

      // Find next ticket (VIP priority)
      let nextTicket = await Ticket.findOne({
        where: {
          status: 'waiting',
          priority: 'vip'
        },
        include: [{ model: Service, as: 'ticketService' }], // FIXED: added 'as'
        order: [['createdAt', 'ASC']]
      });

      if (!nextTicket) {
        nextTicket = await Ticket.findOne({
          where: { status: 'waiting' },
          include: [{ model: Service, as: 'ticketService' }], // FIXED: added 'as'
          order: [['createdAt', 'ASC']]
        });
      }

      if (!nextTicket) {
        return res.status(404).json({
          success: false,
          error: 'No tickets in queue'
        });
      }

      // Update ticket
      await nextTicket.update({
        status: 'called',
        counter_id: counterId,
        called_at: new Date()
      });

      // Update counter
      await counter.update({
        current_ticket_id: nextTicket.id,
        status: 'busy',
        employee_id: employeeId
      });

      // Emit WebSocket event
      if (global.io) {
        global.io.emit('ticket_called', {
          ticket_number: nextTicket.ticket_number,
          counter_id: counterId,
          service: nextTicket.ticketService?.name, // FIXED: use alias
          called_at: new Date()
        });
      }

      res.json({
        success: true,
        message: `Ticket ${nextTicket.ticket_number} called to counter ${counter.number}`,
        ticket: {
          id: nextTicket.id,
          number: nextTicket.ticket_number,
          service: nextTicket.ticketService?.name, // FIXED: use alias
          priority: nextTicket.priority,
          customer_name: nextTicket.customer_name,
          waiting_time: Math.floor((new Date() - nextTicket.createdAt) / 60000) + ' min'
        }
      });

    } catch (error) {
      console.error('Call next ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Start serving ticket
  async startServing(req, res) {
    try {
      const { ticketId } = req.body;
      const employeeId = req.user.id;

      const ticket = await Ticket.findByPk(ticketId, {
        include: [
          { model: Service, as: 'ticketService' }, // FIXED: added 'as'
          { model: Counter, as: 'ticketCounter' }  // FIXED: added 'as'
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status !== 'called') {
        return res.status(400).json({
          success: false,
          error: 'Ticket must be called first'
        });
      }

      // Update ticket
      await ticket.update({
        status: 'serving',
        serving_started_at: new Date()
      });

      // Update counter
      await Counter.update(
        { status: 'busy' },
        { where: { id: ticket.counter_id } }
      );

      res.json({
        success: true,
        message: `Now serving ticket ${ticket.ticket_number}`,
        ticket: {
          number: ticket.ticket_number,
          service: ticket.ticketService?.name, // FIXED: use alias
          customer_name: ticket.customer_name,
          start_time: new Date()
        }
      });

    } catch (error) {
      console.error('Start serving error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Complete ticket service
  async completeService(req, res) {
    try {
      const { ticketId } = req.body;
      const employeeId = req.user.id;

      const ticket = await Ticket.findByPk(ticketId, {
        include: [
          { model: Service, as: 'ticketService' }, // FIXED: added 'as'
          { model: Counter, as: 'ticketCounter' }  // FIXED: added 'as'
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status !== 'serving') {
        return res.status(400).json({
          success: false,
          error: 'Ticket is not being served'
        });
      }

      // Calculate actual service time
      const startTime = ticket.serving_started_at || ticket.called_at;
      const actualServiceTime = Math.floor((new Date() - startTime) / 60000);

      // Update ticket
      await ticket.update({
        status: 'completed',
        completed_at: new Date(),
        actual_service_time: actualServiceTime
      });

      // Update counter
      await Counter.update(
        { 
          current_ticket_id: null,
          status: 'active'
        },
        { where: { id: ticket.counter_id } }
      );

      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} completed`,
        ticket: {
          number: ticket.ticket_number,
          service_time: actualServiceTime + ' min',
          completed_at: new Date()
        }
      });

    } catch (error) {
      console.error('Complete service error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get employee dashboard
  async getDashboard(req, res) {
    try {
      const employeeId = req.user.id;
      const counter = await Counter.findOne({ where: { employee_id: employeeId } });
      
      // Today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const [servedToday, waitingTickets, currentTicket, employeeStats] = await Promise.all([
        // Tickets served today by this employee
        Ticket.count({
          where: {
            counter_id: counter?.id,
            status: 'completed',
            completed_at: { [Op.between]: [today, tomorrow] }
          }
        }),

        // Waiting tickets (for employee's services) - FIXED
        Ticket.count({
          where: { status: 'waiting' },
          include: [{
            model: Service,
            as: 'ticketService', // ← ADDED alias
            where: counter?.services ? {
              code: { [Op.in]: counter.services }
            } : {}
          }]
        }),

        // Current active ticket - FIXED
        counter?.current_ticket_id ? Ticket.findByPk(counter.current_ticket_id, {
          include: [{ model: Service, as: 'ticketService' }] // ← FIXED
        }) : null,

        // Employee performance stats
        Ticket.findAll({
          where: {
            counter_id: counter?.id,
            status: 'completed'
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_served'],
            [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(MINUTE, called_at, completed_at)')), 'avg_service_time']
          ]
        })
      ]);

      res.json({
        success: true,
        dashboard: {
          employee: {
            name: req.user.first_name + ' ' + req.user.last_name,
            counter: counter?.number || 'N/A',
            status: counter?.status || 'inactive'
          },
          stats: {
            served_today: servedToday,
            waiting_tickets: waitingTickets,
            avg_service_time: employeeStats[0]?.dataValues?.avg_service_time?.toFixed(1) || '0'
          },
          current_ticket: currentTicket ? {
            number: currentTicket.ticket_number,
            service: currentTicket.ticketService?.name, // FIXED: use alias
            customer_name: currentTicket.customer_name,
            waiting_since: currentTicket.createdAt
          } : null
        }
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = employeeController;