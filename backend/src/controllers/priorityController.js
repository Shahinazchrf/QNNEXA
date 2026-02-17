// controllers/priorityController.js
const { Ticket, Counter, Service, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class PriorityController {
  /**
   * Prioritize a specific ticket (make it VIP or urgent)
   * POST /api/priority/prioritize/:ticketId
   */
  async prioritizeTicket(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { ticketId } = req.params;
      const { priority, reason } = req.body;
      
      if (!['vip', 'urgent', 'disabled', 'elderly', 'pregnant'].includes(priority)) {
        throw new Error('Invalid priority level');
      }
      
      const ticket = await Ticket.findByPk(ticketId, {
        include: [{ model: Service, as: 'ticketService' }],
        transaction
      });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      if (ticket.status !== 'waiting') {
        throw new Error(`Cannot prioritize ticket with status: ${ticket.status}`);
      }
      
      // Update ticket priority
      const oldPriority = ticket.priority;
      await ticket.update({
        priority,
        is_vip: priority === 'vip',
        priority_changed_at: new Date(),
        priority_change_reason: reason
      }, { transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} prioritized to ${priority}`,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          old_priority: oldPriority,
          new_priority: priority,
          service: ticket.service.name,
          estimated_wait: ticket.estimated_wait_time,
          position: await this.getTicketPosition(ticketId)
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Reassign ticket to different counter
   * POST /api/priority/reassign/:ticketId
   */
  async reassignTicket(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { ticketId } = req.params;
      const { counterId, reason } = req.body;
      
      const ticket = await Ticket.findByPk(ticketId, {
        include: [{ model: Service, as: 'ticketService' }],
        transaction
      });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      // Check if ticket is currently being served
      if (ticket.status === 'serving') {
        throw new Error('Cannot reassign ticket that is currently being served');
      }
      
      const newCounter = await Counter.findByPk(counterId, { transaction });
      if (!newCounter) {
        throw new Error('Counter not found');
      }
      
      // Check if new counter can serve this service
      if (!newCounter.services.includes(ticket.service.code)) {
        throw new Error(`Counter ${newCounter.number} cannot serve ${ticket.service.code} service`);
      }
      
      // Release old counter if exists
      if (ticket.counter_id) {
        const oldCounter = await Counter.findByPk(ticket.counter_id, { transaction });
        if (oldCounter) {
          await oldCounter.update({
            status: 'active',
            current_ticket_id: null
          }, { transaction });
        }
      }
      
      // Update ticket
      const oldCounterId = ticket.counter_id;
      await ticket.update({
        counter_id: counterId,
        reassigned_at: new Date(),
        reassignment_reason: reason,
        status: ticket.status === 'called' ? 'waiting' : ticket.status // Reset to waiting if called
      }, { transaction });
      
      // Update new counter if ticket is called
      if (ticket.status === 'called') {
        await newCounter.update({
          status: 'busy',
          current_ticket_id: ticketId
        }, { transaction });
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} reassigned to counter ${newCounter.number}`,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          old_counter_id: oldCounterId,
          new_counter_id: counterId,
          new_counter_number: newCounter.number,
          service: ticket.service.name,
          status: ticket.status
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Skip a ticket (mark as missed manually)
   * POST /api/priority/skip/:ticketId
   */
  async skipTicket(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { ticketId } = req.params;
      const { reason } = req.body;
      
      const ticket = await Ticket.findByPk(ticketId, {
        include: [{ model: Counter, as: 'ticketCounter' }],
        transaction
      });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      if (!['called', 'waiting'].includes(ticket.status)) {
        throw new Error(`Cannot skip ticket with status: ${ticket.status}`);
      }
      
      // Mark as missed
      await ticket.update({
        status: 'missed',
        missed_at: new Date(),
        skip_reason: reason,
        skipped_by: req.user.id
      }, { transaction });
      
      // Release counter if exists
      if (ticket.counter_id && ticket.counter) {
        await ticket.counter.update({
          status: 'active',
          current_ticket_id: null
        }, { transaction });
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} skipped (marked as missed)`,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          status: 'missed',
          missed_at: new Date(),
          reason: reason
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Analyze queue for optimization
   * GET /api/priority/queue-analysis
   */
  async analyzeQueue(req, res) {
    try {
      const { serviceCode } = req.query;
      
      // Get all waiting tickets
      const waitingTickets = await Ticket.findAll({
        where: {
          status: 'waiting',
          ...(serviceCode && {
            '$service.code$': serviceCode
          })
        },
        include: [
          { model: Service, as: 'ticketService' },
          { model: User, as: 'client' }
        ],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ]
      });
      
      // Get all active counters
      const activeCounters = await Counter.findAll({
        where: {
          is_active: true,
          status: { [Op.in]: ['active', 'busy'] }
        },
        include: [
          { model: Ticket, as: 'current_ticket' },
          { model: User, as: 'employee' }
        ]
      });
      
      // Analyze service distribution
      const serviceAnalysis = {};
      waitingTickets.forEach(ticket => {
        const serviceCode = ticket.service.code;
        if (!serviceAnalysis[serviceCode]) {
          serviceAnalysis[serviceCode] = {
            count: 0,
            vips: 0,
            avg_wait: 0,
            tickets: []
          };
        }
        serviceAnalysis[serviceCode].count++;
        if (ticket.is_vip) serviceAnalysis[serviceCode].vips++;
        serviceAnalysis[serviceCode].tickets.push({
          number: ticket.ticket_number,
          priority: ticket.priority,
          waiting_since: ticket.createdAt
        });
      });
      
      // Calculate counters by service
      const counterAnalysis = {};
      activeCounters.forEach(counter => {
        counter.services.forEach(serviceCode => {
          if (!counterAnalysis[serviceCode]) {
            counterAnalysis[serviceCode] = {
              total_counters: 0,
              available_counters: 0,
              busy_counters: 0
            };
          }
          counterAnalysis[serviceCode].total_counters++;
          
          if (counter.status === 'busy') {
            counterAnalysis[serviceCode].busy_counters++;
          } else {
            counterAnalysis[serviceCode].available_counters++;
          }
        });
      });
      
      // Generate recommendations
      const recommendations = [];
      
      Object.keys(serviceAnalysis).forEach(serviceCode => {
        const waitingCount = serviceAnalysis[serviceCode].count;
        const availableCounters = counterAnalysis[serviceCode]?.available_counters || 0;
        const vipCount = serviceAnalysis[serviceCode].vips;
        
        if (waitingCount > 10 && availableCounters === 0) {
          recommendations.push({
            service: serviceCode,
            issue: 'High demand, no available counters',
            suggestion: 'Open additional counter for this service',
            urgency: 'high'
          });
        }
        
        if (vipCount > 0 && vipCount >= waitingCount * 0.3) {
          recommendations.push({
            service: serviceCode,
            issue: 'High VIP concentration',
            suggestion: 'Consider VIP-dedicated counter',
            urgency: 'medium'
          });
        }
        
        if (waitingCount > 20) {
          recommendations.push({
            service: serviceCode,
            issue: 'Very long queue',
            suggestion: 'Increase service capacity or add temporary counter',
            urgency: 'high'
          });
        }
      });
      
      res.json({
        success: true,
        analysis: {
          total_waiting: waitingTickets.length,
          by_service: serviceAnalysis,
          counters_by_service: counterAnalysis,
          active_counters: activeCounters.length,
          recommendations,
          timestamp: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Helper: Get ticket position in queue
   */
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
    
    return position + 1;
  }
}

module.exports = new PriorityController();