const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const { authMiddleware, requireEmployee, requireAdmin } = require('../middlewares/auth');

// PUBLIC ROUTES
// Create normal ticket (public - no auth needed)
router.post('/normal', async (req, res) => {
  try {
    const { serviceCode, clientId, customerName } = req.body;
    
    if (!serviceCode) {
      return res.status(400).json({
        success: false,
        error: 'serviceCode is required'
      });
    }

    const result = await ticketService.createNormalTicket(serviceCode, clientId, customerName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create VIP ticket or appointment (requires client auth)
router.post('/vip', authMiddleware, async (req, res) => {
  try {
    const { serviceCode, isAppointment, appointmentTime, vipCode } = req.body;
    
    if (!serviceCode) {
      return res.status(400).json({
        success: false,
        error: 'serviceCode is required'
      });
    }

    const clientId = req.user.id;
    
    const result = await ticketService.createVIPTicket(serviceCode, clientId, {
      isAppointment,
      appointmentTime,
      vipCode,
      customerName: `${req.user.first_name} ${req.user.last_name}`
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get ticket status (public)
router.get('/:ticketNumber/status', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    const ticket = await Ticket.findOne({
      where: { ticket_number: ticketNumber },
      include: [
        { model: Service, as: 'service' },
        { model: Counter, as: 'counter' }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const position = await ticketService.getTicketPosition(ticket.id);
    
    res.json({
      success: true,
      ticket: {
        number: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        is_vip: ticket.is_vip,
        is_appointment: ticket.is_appointment,
        service: ticket.service?.name,
        counter: ticket.counter?.number,
        position_in_queue: position,
        estimated_wait: ticket.estimated_wait_time,
        created_at: ticket.createdAt,
        called_at: ticket.called_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// EMPLOYEE ROUTES
router.use(authMiddleware);
router.use(requireEmployee);

// Get next ticket for counter
router.post('/call-next', async (req, res) => {
  try {
    const { counterId } = req.body;
    
    if (!counterId) {
      return res.status(400).json({
        success: false,
        error: 'counterId is required'
      });
    }

    const ticket = await ticketService.getNextTicketForCounter(counterId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'No tickets in queue for this counter'
      });
    }

    // Mark ticket as called
    await ticket.update({
      status: 'called',
      counter_id: counterId,
      employee_id: req.user.id,
      called_at: new Date()
    });

    // Update counter status
    const counter = await Counter.findByPk(counterId);
    if (counter) {
      await counter.update({
        status: 'busy',
        current_ticket_id: ticket.id,
        employee_id: req.user.id
      });
    }

    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} called to counter ${counterId}`,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        service: ticket.service?.name,
        priority: ticket.priority,
        customer_name: ticket.customer_name,
        is_vip: ticket.is_vip,
        is_appointment: ticket.is_appointment,
        client: ticket.client
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ADMIN ROUTES
router.use(requireAdmin);

// Prioritize ticket
router.put('/:ticketId/priority', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;
    
    if (!priority) {
      return res.status(400).json({
        success: false,
        error: 'priority is required'
      });
    }

    const result = await ticketService.prioritizeTicket(ticketId, priority);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reassign ticket to different service
router.put('/:ticketId/reassign', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { newServiceCode } = req.body;
    
    if (!newServiceCode) {
      return res.status(400).json({
        success: false,
        error: 'newServiceCode is required'
      });
    }

    const result = await ticketService.reassignTicket(ticketId, newServiceCode);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run automatic missed ticket cleanup
router.post('/cleanup/missed', async (req, res) => {
  try {
    const result = await ticketService.markMissedTickets();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue statistics
router.get('/stats/queue', async (req, res) => {
  try {
    const { serviceCode } = req.query;
    const stats = await ticketService.getQueueStats(serviceCode);
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;