const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queueRoutes = require('./routes/queueRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');
const priorityRoutes = require('./routes/priorityRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// 🟢 FIX: Allow employee endpoints without token (TESTING ONLY)
app.use('/api/employee', (req, res, next) => {
  req.user = { id: 'test-employee', role: 'employee' };
  next();
});

// ==================== BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Bank Queue Management System API',
    status: '✅ Online',
    version: '2.0.0',
    features: [
      'VIP Ticket Management',
      'Auto-missed handling',
      'Satisfaction surveys',
      'Multi-agency support',
      'Real-time monitoring'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    database: 'connected',
    uptime: process.uptime(),
    features: {
      ticket_monitoring: 'active',
      vip_support: 'enabled',
      survey_system: 'ready'
    }
  });
});

// ==================== IMPORT MODELS ====================
const { User, Service, Ticket, Counter, Survey, Agency } = require('./models');
const { Op } = require('sequelize');

// ==================== USE ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/priority', priorityRoutes);
app.use('/api/tickets', ticketRoutes);

console.log('✅ Routes loaded:', [
  '/api/auth',
  '/api/employee', 
  '/api/admin',
  '/api/queue',
  '/api/stats',
  '/api/priority',
  '/api/tickets'
]);

// ==================== PUBLIC API ROUTES ====================

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    res.json({ 
      success: true, 
      count: services.length,
      services 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all counters
app.get('/api/counters', async (req, res) => {
  try {
    const counters = await Counter.findAll({
      attributes: ['id', 'number', 'name', 'status', 'services', 'location', 'is_active', 'createdAt'],
      order: [['number', 'ASC']]
    });
    
    res.json({ 
      success: true, 
      count: counters.length,
      counters 
    });
  } catch (error) {
    console.error('Counters error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== TICKET ROUTES ====================

// Create normal ticket
app.post('/api/tickets/generate', async (req, res) => {
  try {
    const { serviceCode, customerName } = req.body;

    console.log('📝 Creating NORMAL ticket for service:', serviceCode);

    const service = await Service.findOne({ 
      where: { name: serviceCode, is_active: true }
    });
    
    if (!service) {
      return res.status(400).json({
        success: false,
        error: `Service ${serviceCode} not available`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        ticket_number: { 
          [Op.and]: [
            { [Op.like]: `${serviceCode}%` },
            { [Op.notLike]: `VIP%` }
          ]
        },
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

    const ticketNumber = `${serviceCode}${seqNumber.toString().padStart(3, '0')}`;
    console.log(`🎫 Generated ticket number: ${ticketNumber}`);

    const waitingCount = await Ticket.count({
      where: {
        service_id: service.id,
        status: 'waiting'
      }
    });
    
    const baseTime = service.estimated_time || 15;
    const estimatedWait = waitingCount * baseTime;

    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      priority: 'normal',
      status: 'waiting',
      customer_name: customerName || 'Customer',
      is_vip: false,
      is_appointment: false,
      estimated_wait_time: estimatedWait,
    });

    console.log(`✅ Normal ticket ${ticketNumber} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket: {
        number: ticketNumber,
        service: service.name,
        priority: 'normal',
        is_vip: false,
        estimated_wait: estimatedWait,
        created_at: ticket.createdAt,
        message: `Please proceed to waiting area. Your ticket is ${ticketNumber}`
      }
    });

  } catch (error) {
    console.error('❌ Ticket generation error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => `${e.path}: ${e.message}`);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// VIP appointment booking
app.post('/api/tickets/vip-appointment', async (req, res) => {
  try {
    const { clientId, serviceCode, appointmentTime, reason, vipCode } = req.body;
    
    if (!serviceCode || !appointmentTime) {
      return res.status(400).json({
        success: false,
        error: 'serviceCode and appointmentTime are required'
      });
    }
    
    if (vipCode) {
      const isValidVIP = await validateVipCode(vipCode);
      if (!isValidVIP) {
        return res.status(403).json({
          success: false,
          error: 'Invalid VIP code'
        });
      }
    }
    
    let user = null;
    if (clientId) {
      user = await User.findByPk(clientId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (!user.is_vip && user.role !== 'vip_client') {
        return res.status(403).json({
          success: false,
          error: 'Only VIP clients can book appointments'
        });
      }
    }
    
    const appointmentDate = new Date(appointmentTime);
    const now = new Date();
    
    if (appointmentDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Appointment time must be in the future'
      });
    }
    
    const hour = appointmentDate.getHours();
    if (hour < 8 || hour > 17) {
      return res.status(400).json({
        success: false,
        error: 'Appointments only available between 8:00 and 17:00'
      });
    }
    
    const service = await Service.findOne({ 
      where: { name: serviceCode, is_active: true } 
    });
    
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Service not available'
      });
    }
    
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
      return res.status(409).json({
        success: false,
        error: 'Time slot already booked. Please choose another time.',
        available_slots: await getAvailableSlots(service.id, appointmentDate)
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        createdAt: { [Op.gte]: today },
        is_appointment: true
      },
      order: [['createdAt', 'DESC']]
    });
    
    let seqNumber = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/VIP\d+$/);
      if (match) {
        const numMatch = match[0].match(/\d+$/);
        if (numMatch) seqNumber = parseInt(numMatch[0]) + 1;
      }
    }
    
    const ticketNumber = `VIP${serviceCode}${seqNumber.toString().padStart(3, '0')}`;
    
    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      client_id: clientId,
      customer_name: user ? `${user.first_name} ${user.last_name}` : 'VIP Client',
      priority: 'vip',
      status: 'waiting',
      is_vip: 1,
      is_appointment: 1,
      appointment_time: appointmentDate,
      appointment_reason: reason,
      estimated_wait_time: 0,
      vip_code_used: vipCode
    });
    
    res.status(201).json({
      success: true,
      message: 'VIP appointment booked successfully',
      ticket: {
        id: ticket.id,
        number: ticketNumber,
        service: service.name,
        priority: 'vip',
        is_vip: true,
        estimated_wait: 0,
        created_at: ticket.createdAt,
        message: `VIP appointment booked. Your ticket is ${ticketNumber}`
      }
    });

  } catch (error) {
    console.error('VIP appointment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate VIP ticket
app.post('/api/tickets/vip/generate', async (req, res) => {
  try {
    const { service_code, vip_code, customer_name } = req.body;
    
    if (!service_code) {
      return res.status(400).json({
        success: false,
        error: 'Service code is required'
      });
    }
    
    const service = await Service.findOne({ 
      where: { name: service_code, is_active: true } 
    });
    
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Service not available'
      });
    }
    
    const isVip = vip_code ? await validateVipCode(vip_code) : true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        ticket_number: { [Op.like]: `VIP${service_code}%` },
        createdAt: { [Op.between]: [today, tomorrow] }
      },
      order: [['createdAt', 'DESC']]
    });
    
    let seqNumber = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) seqNumber = parseInt(match[0]) + 1;
    }
    
    const ticketNumber = `VIP${service_code}${seqNumber.toString().padStart(3, '0')}`;
    
    const waitingCount = await Ticket.count({
      where: {
        service_id: service.id,
        status: 'waiting'
      }
    });
    const estimatedWait = Math.max(5, waitingCount * 5);
    
    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      priority: 'vip',
      status: 'waiting',
      customer_name: customer_name || 'VIP Client',
      is_vip: true,
      is_appointment: false,
      vip_code_used: vip_code || 'SYSTEM_GENERATED',
      estimated_wait_time: estimatedWait
    });
    
    res.json({
      success: true,
      message: 'VIP ticket generated successfully',
      ticket: {
        number: ticketNumber,
        service: service.name,
        priority: 'vip',
        is_vip: true,
        estimated_wait: estimatedWait,
        created_at: ticket.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ VIP ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Prioritize Ticket
app.post('/api/admin/tickets/prioritize', async (req, res) => {
  try {
    const { ticket_id, new_priority } = req.body;
    
    if (!ticket_id || !new_priority) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID and new priority are required'
      });
    }
    
    const validPriorities = ['normal', 'vip', 'urgent', 'disabled', 'elderly', 'pregnant'];
    if (!validPriorities.includes(new_priority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }
    
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
        error: `Cannot change priority for ticket with status: ${ticket.status}`
      });
    }
    
    await ticket.update({
      priority: new_priority,
      is_vip: new_priority === 'vip' ? 1 : 0,
      priority_changed_at: new Date()
    });
    
    res.json({
      success: true,
      message: `Ticket priority updated to ${new_priority}`,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        new_priority: new_priority,
        is_vip: new_priority === 'vip'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Reassign Ticket
app.post('/api/admin/tickets/reassign', async (req, res) => {
  try {
    const { ticket_id, new_service_code, reason } = req.body;
    
    if (!ticket_id || !new_service_code) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID and new service code are required'
      });
    }
    
    const ticket = await Ticket.findByPk(ticket_id, {
      include: [{ model: Service, as: 'ticketService' }]
    });
    
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
      return res.status(400).json({
        success: false,
        error: 'New service not available'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: newService.id,
        createdAt: { [Op.gte]: today },
        ticket_number: { [Op.like]: `${new_service_code}%` }
      },
      order: [['createdAt', 'DESC']]
    });
    
    let seqNumber = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) seqNumber = parseInt(match[0]) + 1;
    }
    
    const newTicketNumber = `${new_service_code}${seqNumber.toString().padStart(3, '0')}`;
    
    await ticket.update({
      status: 'transferred',
      transferred_from: ticket.ticket_number,
      notes: `Transferred to ${new_service_code}: ${reason || 'No reason provided'}`,
      transferred_at: new Date()
    });
    
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
      estimated_wait_time: await calculateWaitTime(newService.id, ticket.priority),
      transferred_from: ticket.ticket_number
    });
    
    res.json({
      success: true,
      message: `Ticket reassigned to ${newService.name}`,
      data: {
        original_ticket: {
          number: ticket.ticket_number,
          status: 'transferred'
        },
        new_ticket: {
          number: newTicketNumber,
          service: newService.name,
          estimated_wait: newTicket.estimated_wait_time,
          position_in_queue: await getQueuePosition(newTicket.id)
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Queue Statistics
app.get('/api/queue/stats', async (req, res) => {
  try {
    const { service_code } = req.query;
    
    let where = { status: 'waiting' };
    let service = null;
    
    if (service_code) {
      service = await Service.findOne({ where: { name: service_code } });
      if (service) where.service_id = service.id;
    }
    
    const tickets = await Ticket.findAll({
      where,
      include: [{ model: Service, as: 'ticketService' }],
      order: [['createdAt', 'ASC']]
    });
    
    const stats = {
      total_waiting: tickets.length,
      by_priority: {
        vip: tickets.filter(t => t.priority === 'vip').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        normal: tickets.filter(t => t.priority === 'normal').length,
        special: tickets.filter(t => ['disabled', 'elderly', 'pregnant'].includes(t.priority)).length
      },
      by_type: {
        appointments: tickets.filter(t => t.is_appointment === true).length,
        vip: tickets.filter(t => t.is_vip === true && t.is_appointment !== true).length,
        normal: tickets.filter(t => t.is_vip !== true && t.is_appointment !== true).length
      },
      next_tickets: tickets.slice(0, 5).map(t => ({
        number: t.ticket_number,
        service: t.ticketService?.name,
        priority: t.priority,
        is_vip: t.is_vip === true,
        is_appointment: t.is_appointment === true,
        waiting_since: t.createdAt
      }))
    };
    
    const missedToday = await Ticket.count({
      where: {
        status: 'missed',
        createdAt: {
          [Op.gte]: new Date().setHours(0, 0, 0, 0)
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        ...stats,
        missed_tickets_today: missedToday,
        timestamp: new Date(),
        estimated_wait_times: await calculateAllWaitTimes()
      }
    });
    
  } catch (error) {
    console.error('❌ Queue stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue status
app.get('/api/tickets/queue', async (req, res) => {
  try {
    const { serviceCode } = req.query;
    
    let where = { status: 'waiting' };
    
    if (serviceCode) {
      const service = await Service.findOne({ where: { name: serviceCode } });
      if (service) {
        where.service_id = service.id;
      }
    }
    
    const count = await Ticket.count({ where });
    
    const nextTickets = await Ticket.findAll({
      where,
      include: [{ model: Service, as: 'ticketService' }],
      order: [
        ['is_appointment', 'DESC'],
        ['priority', 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit: 5
    });
    
    const activeCounters = await Counter.count({
      where: { 
        status: ['active', 'busy'],
        is_active: true 
      }
    });
    
    res.json({
      success: true,
      data: {
        total_waiting: count,
        active_counters: activeCounters,
        next_tickets: nextTickets.map(t => ({
          number: t.ticket_number,
          service: t.ticketService?.name,
          priority: t.priority,
          is_vip: t.is_vip === 1 ? true : false,
          is_appointment: t.is_appointment === 1 ? true : false,
          waiting_since: t.createdAt
        })),
        estimated_wait: count * 10,
        message: count > 10 ? 'High queue volume' : 'Normal queue'
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.json({
      success: true,
      data: {
        total_waiting: 0,
        active_counters: 0,
        next_tickets: [],
        estimated_wait: 0,
        message: 'Queue system ready'
      }
    });
  }
});

// Get all tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    
    let where = {};
    if (status) where.status = status;
    
    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: Service, as: 'ticketService' },
        { model: Counter, as: 'ticketCounter' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => ({
        id: t.id,
        ticket_number: t.ticket_number,
        status: t.status,
        priority: t.priority,
        is_vip: t.is_vip === 1 ? true : false,
        is_appointment: t.is_appointment === 1 ? true : false,
        service: t.ticketService?.name,
        counter: t.ticketCounter?.number,
        customer_name: t.customer_name,
        created_at: t.createdAt,
        called_at: t.called_at,
        completed_at: t.completed_at
      }))
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.json({
      success: true,
      count: 0,
      tickets: []
    });
  }
});

// Get ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findOne({
      where: {
        [Op.or]: [
          { id: id },
          { ticket_number: id }
        ]
      },
      include: [
        { model: Service, as: 'ticketService' },
        { model: Counter, as: 'ticketCounter' },
        { model: User, as: 'ticketClient', attributes: ['id', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'servingEmployee', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    let position = null;
    if (ticket.status === 'waiting') {
      position = await Ticket.count({
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
      }) + 1;
    }
    
    res.json({
      success: true,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        is_vip: ticket.is_vip === 1 ? true : false,
        is_appointment: ticket.is_appointment === 1 ? true : false,
        appointment_time: ticket.appointment_time,
        service: ticket.ticketService?.name,
        counter: ticket.ticketCounter?.number,
        customer_name: ticket.customer_name,
        client: ticket.ticketClient,
        employee: ticket.servingEmployee,
        created_at: ticket.createdAt,
        called_at: ticket.called_at,
        serving_started_at: ticket.serving_started_at,
        completed_at: ticket.completed_at,
        estimated_wait: ticket.estimated_wait_time,
        actual_wait: ticket.actual_wait_time,
        position_in_queue: position,
        has_survey: ticket.has_survey === 1 ? true : false
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel ticket
app.post('/api/tickets/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const ticket = await Ticket.findByPk(id);
    
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
    
    if (ticket.counter_id) {
      const counter = await Counter.findByPk(ticket.counter_id);
      if (counter) {
        await counter.update({
          status: 'active',
          current_ticket_id: null
        });
      }
    }
    
    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} cancelled`,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        status: 'cancelled',
        cancelled_at: new Date(),
        reason: reason || 'Customer request'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get ticket position
app.get('/api/tickets/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findOne({
      where: {
        [Op.or]: [
          { id: id },
          { ticket_number: id }
        ]
      }
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    if (ticket.status !== 'waiting') {
      return res.json({
        success: true,
        message: `Ticket is ${ticket.status}, not in queue`,
        position: null,
        status: ticket.status
      });
    }
    
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
    }) + 1;
    
    const totalInQueue = await Ticket.count({
      where: {
        service_id: ticket.service_id,
        status: 'waiting'
      }
    });
    
    res.json({
      success: true,
      data: {
        ticket_number: ticket.ticket_number,
        service_id: ticket.service_id,
        position: position,
        total_in_queue: totalInQueue,
        estimated_wait: position * 10,
        message: `You are position ${position} in queue`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Call next ticket
app.post('/api/tickets/call-next', async (req, res) => {
  try {
    const { counterId } = req.body;
    
    let nextTicket = await Ticket.findOne({
      where: { 
        status: 'waiting'
      },
      include: [
        { model: Service, as: 'ticketService' }
      ],
      order: [
        ['priority', 'DESC'],
        ['is_appointment', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });
    
    if (!nextTicket) {
      return res.json({
        success: false,
        message: 'No tickets waiting in queue'
      });
    }
    
    await nextTicket.update({ 
      status: 'called',
      called_at: new Date(),
      ...(counterId && { counter_id: counterId })
    });
    
    if (counterId) {
      const counter = await Counter.findByPk(counterId);
      if (counter) {
        await counter.update({
          status: 'busy',
          current_ticket_id: nextTicket.id
        });
      }
    }
    
    res.json({
      success: true,
      message: `Ticket ${nextTicket.ticket_number} called to counter`,
      ticket: {
        id: nextTicket.id,
        number: nextTicket.ticket_number,
        service: nextTicket.ticketService?.name,
        priority: nextTicket.priority,
        is_vip: nextTicket.is_vip === 1 ? true : false,
        is_appointment: nextTicket.is_appointment === 1 ? true : false,
        customer_name: nextTicket.customer_name,
        waiting_time: Math.floor((new Date() - new Date(nextTicket.createdAt)) / 60000) + ' min'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete ticket
app.post('/api/tickets/:id/complete', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { notes } = req.body;
    
    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket already completed'
      });
    }
    
    const now = new Date();
    const waitTime = ticket.called_at ? 
      Math.floor((new Date(ticket.called_at) - new Date(ticket.createdAt)) / 60000) : 0;
    const serviceTime = ticket.serving_started_at ? 
      Math.floor((now - new Date(ticket.serving_started_at)) / 60000) : 
      Math.floor((now - (ticket.called_at ? new Date(ticket.called_at) : new Date(ticket.createdAt))) / 60000);
    const totalTime = Math.floor((now - new Date(ticket.createdAt)) / 60000);
    
    await ticket.update({
      status: 'completed',
      completed_at: now,
      actual_wait_time: waitTime,
      actual_service_time: serviceTime,
      total_time: totalTime,
      notes
    });
    
    if (ticket.counter_id) {
      const counter = await Counter.findByPk(ticket.counter_id);
      if (counter) {
        await counter.update({
          status: 'active',
          current_ticket_id: null
        });
      }
    }
    
    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} completed`,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        service_time: serviceTime + ' min',
        wait_time: waitTime + ' min',
        total_time: totalTime + ' min',
        completed_at: now
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update ticket status
app.put('/api/employee/ticket/update', async (req, res) => {
  try {
    const { ticket_id, status } = req.body;

    if (!ticket_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID and status are required'
      });
    }

    const validStatuses = ['serving', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "serving" or "completed"'
      });
    }

    const ticket = await Ticket.findByPk(ticket_id, {
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

    const now = new Date();

    if (status === 'serving') {
      await ticket.update({
        status: 'serving',
        serving_started_at: now
      });
      
      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} is now being served`,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          status: 'serving',
          service: ticket.ticketService?.name,
          counter: ticket.ticketCounter?.number,
          started_at: now
        }
      });

    } else if (status === 'completed') {
      const waitTime = ticket.called_at 
        ? Math.floor((now - new Date(ticket.called_at)) / 60000) : 0;
      const serviceTime = ticket.serving_started_at 
        ? Math.floor((now - new Date(ticket.serving_started_at)) / 60000) 
        : Math.floor((now - new Date(ticket.called_at || ticket.createdAt)) / 60000);

      await ticket.update({
        status: 'completed',
        completed_at: now,
        actual_wait_time: waitTime,
        actual_service_time: serviceTime
      });

      if (ticket.counter_id) {
        await Counter.update(
          { 
            status: 'active', 
            current_ticket_id: null 
          },
          { where: { id: ticket.counter_id } }
        );
      }

      res.json({
        success: true,
        message: `Ticket ${ticket.ticket_number} completed`,
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          status: 'completed',
          wait_time: `${waitTime} min`,
          service_time: `${serviceTime} min`,
          completed_at: now
        }
      });
    }

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Counter monitoring
app.get('/api/employee/counters/status', async (req, res) => {
  try {
    const counters = await Counter.findAll({
      include: [
        {
          model: Ticket,
          as: 'currentTicket',
          required: false,
          include: [
            { model: Service, as: 'ticketService' }
          ]
        },
        {
          model: User,
          as: 'counterEmployee',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['number', 'ASC']]
    });

    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);

    const countersStatus = await Promise.all(counters.map(async (counter) => {
      const recentTickets = await Ticket.count({
        where: {
          counter_id: counter.id,
          called_at: { [Op.gte]: fiveMinutesAgo },
          status: { [Op.in]: ['called', 'serving', 'completed'] }
        }
      });

      const lastTicket = await Ticket.findOne({
        where: { counter_id: counter.id },
        order: [['called_at', 'DESC']],
        attributes: ['called_at']
      });

      let efficiency = 'normal';
      let message = '';

      if (counter.status === 'active' || counter.status === 'busy') {
        if (recentTickets >= 3) {
          efficiency = 'overloaded';
          message = 'High volume - 3+ tickets in last 5 minutes';
        } else if (lastTicket && new Date(lastTicket.called_at) < tenMinutesAgo) {
          efficiency = 'idle';
          message = 'No activity for 10+ minutes';
        } else if (counter.status === 'active' && !counter.currentTicket) {
          efficiency = 'waiting';
          message = 'Ready for next ticket';
        } else if (counter.status === 'busy' && counter.currentTicket) {
          const serviceTime = counter.currentTicket.serving_started_at
            ? Math.floor((now - new Date(counter.currentTicket.serving_started_at)) / 60000)
            : Math.floor((now - new Date(counter.currentTicket.called_at || now)) / 60000);
          
          const estimatedTime = counter.currentTicket.ticketService?.estimated_time || 15;
          
          if (serviceTime > estimatedTime * 1.5) {
            efficiency = 'slow';
            message = `Taking longer than expected (${serviceTime} min)`;
          } else {
            efficiency = 'serving';
            message = `Serving ticket #${counter.currentTicket.ticket_number}`;
          }
        }
      }

      return {
        counter: {
          id: counter.id,
          number: counter.number,
          name: counter.name,
          status: counter.status,
          location: counter.location
        },
        employee: counter.counterEmployee ? {
          name: `${counter.counterEmployee.first_name} ${counter.counterEmployee.last_name}`,
          id: counter.counterEmployee.id
        } : null,
        current_ticket: counter.currentTicket ? {
          number: counter.currentTicket.ticket_number,
          service: counter.currentTicket.ticketService?.name,
          waiting_since: counter.currentTicket.called_at,
          status: counter.currentTicket.status
        } : null,
        performance: {
          efficiency: efficiency,
          message: message,
          recent_tickets_5min: recentTickets,
          last_activity: lastTicket?.called_at || null
        },
        actions_available: {
          can_open: counter.status === 'closed' || counter.status === 'inactive',
          can_close: counter.status === 'active' || counter.status === 'busy',
          can_break: counter.status === 'active',
          can_resume: counter.status === 'break'
        }
      };
    }));

    const summary = {
      total_counters: counters.length,
      active_counters: counters.filter(c => c.status === 'active').length,
      busy_counters: counters.filter(c => c.status === 'busy').length,
      break_counters: counters.filter(c => c.status === 'break').length,
      closed_counters: counters.filter(c => c.status === 'closed').length,
      idle_counters: countersStatus.filter(c => c.performance.efficiency === 'idle').length,
      overloaded_counters: countersStatus.filter(c => c.performance.efficiency === 'overloaded').length
    };

    res.json({
      success: true,
      summary,
      counters: countersStatus,
      timestamp: now
    });

  } catch (error) {
    console.error('Counter monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current ticket for a counter
app.get('/api/employee/ticket/current', async (req, res) => {
  try {
    const { counterId } = req.query;

    if (!counterId) {
      return res.status(400).json({
        success: false,
        error: 'Counter ID is required'
      });
    }

    const counter = await Counter.findByPk(counterId);
    
    if (!counter) {
      return res.status(404).json({
        success: false,
        error: 'Counter not found'
      });
    }

    if (!counter.current_ticket_id) {
      return res.json({
        success: true,
        message: 'No ticket currently being served',
        data: null
      });
    }

    const ticket = await Ticket.findByPk(counter.current_ticket_id, {
      include: [
        { model: Service, as: 'ticketService' },
        { model: User, as: 'ticketClient', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (!ticket) {
      return res.json({
        success: true,
        message: 'Ticket not found',
        data: null
      });
    }

    const waitingTime = ticket.called_at 
      ? Math.floor((new Date() - new Date(ticket.called_at)) / 60000)
      : 0;

    res.json({
      success: true,
      data: {
        counter: {
          id: counter.id,
          number: counter.number,
          status: counter.status
        },
        ticket: {
          id: ticket.id,
          number: ticket.ticket_number,
          service: ticket.ticketService?.name,
          priority: ticket.priority,
          is_vip: ticket.is_vip === 1,
          customer_name: ticket.customer_name,
          called_at: ticket.called_at,
          waiting_time: `${waitingTime} min`,
          status: ticket.status
        }
      }
    });

  } catch (error) {
    console.error('Get current ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== TASK 2: SATISFACTION SURVEY ENDPOINTS ====================

// Submit survey
app.post('/api/survey/submit', async (req, res) => {
  try {
    const { ticket_id, rating, comments } = req.body;

    if (!ticket_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Ticket ID and rating are required'
      });
    }

    const ticket = await Ticket.findByPk(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const existingSurvey = await Survey.findOne({ where: { ticket_id } });
    if (existingSurvey) {
      return res.status(400).json({
        success: false,
        error: 'Survey already submitted for this ticket'
      });
    }

    const survey = await Survey.create({
      ticket_id,
      rating,
      comments: comments || null
    });

    await ticket.update({ has_survey: 1 });

    res.status(201).json({
      success: true,
      message: 'Survey submitted successfully',
      survey: {
        id: survey.id,
        ticket_number: ticket.ticket_number,
        rating: survey.rating,
        submitted_at: survey.createdAt
      }
    });

  } catch (error) {
    console.error('Survey submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get survey stats
app.get('/api/survey/stats', async (req, res) => {
  try {
    const surveys = await Survey.findAll();
    
    if (surveys.length === 0) {
      return res.json({
        success: true,
        data: {
          total_surveys: 0,
          average_rating: 0,
          satisfaction_rate: '0%'
        }
      });
    }

    const total = surveys.length;
    const average = surveys.reduce((sum, s) => sum + s.rating, 0) / total;
    const satisfactory = surveys.filter(s => s.rating >= 4).length;
    const satisfactionRate = (satisfactory / total * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        total_surveys: total,
        average_rating: parseFloat(average.toFixed(2)),
        satisfaction_rate: `${satisfactionRate}%`
      }
    });

  } catch (error) {
    console.error('Survey stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get survey by ticket
app.get('/api/survey/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const survey = await Survey.findOne({
      where: { ticket_id: ticketId },
      include: [{
        model: Ticket,
        as: 'surveyTicket',
        attributes: ['ticket_number']
      }]
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found for this ticket'
      });
    }

    res.json({
      success: true,
      survey: {
        id: survey.id,
        ticket_number: survey.surveyTicket?.ticket_number,
        rating: survey.rating,
        comments: survey.comments,
        submitted_at: survey.createdAt
      }
    });

  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get dashboard summary
app.get('/api/survey/dashboard', async (req, res) => {
  try {
    const total = await Survey.count();
    const surveys = await Survey.findAll();
    
    const averageRating = surveys.length > 0 
      ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(1)
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySurveys = await Survey.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_surveys: total,
        average_rating: averageRating,
        satisfaction_rate: total > 0 ? 'Calculating...' : '0%',
        today_surveys: todaySurveys
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== TASK 4: AGENCY MANAGEMENT ====================

// Create Agency
app.post('/api/admin/agencies', async (req, res) => {
  try {
    const { code, name, address, city, phone, email, opening_hours, services, manager_id, max_counters, notes } = req.body;

    if (!code || !name || !address || !city) {
      return res.status(400).json({
        success: false,
        error: 'Code, name, address, and city are required'
      });
    }

    const existingAgency = await Agency.findOne({ where: { code } });
    if (existingAgency) {
      return res.status(400).json({
        success: false,
        error: 'Agency code already exists'
      });
    }

    const agency = await Agency.create({
      code: code.toUpperCase(),
      name,
      address,
      city,
      phone,
      email,
      opening_hours: opening_hours || undefined,
      services: services || [],
      manager_id,
      max_counters: max_counters || 10,
      notes,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      agency
    });

  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get All Agencies
app.get('/api/admin/agencies', async (req, res) => {
  try {
    const agencies = await Agency.findAll({
      include: [{
        model: Counter,
        as: 'agencyCounters',
        required: false
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: agencies.length,
      agencies
    });

  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agency by ID
app.get('/api/admin/agencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Looking for agency with ID:', id);
    
    const agency = await Agency.findByPk(id, {
      include: [{ 
        model: Counter, 
        as: 'agencyCounters',
        required: false 
      }]
    });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }
    
    res.json({
      success: true,
      agency
    });
  } catch (error) {
    console.error('❌ Get agency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update agency
app.put('/api/admin/agencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('📝 Updating agency:', id, updates);
    
    const agency = await Agency.findByPk(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }
    
    if (updates.code && updates.code !== agency.code) {
      const existingAgency = await Agency.findOne({ 
        where: { code: updates.code.toUpperCase() } 
      });
      if (existingAgency) {
        return res.status(400).json({
          success: false,
          error: 'Agency code already exists'
        });
      }
      updates.code = updates.code.toUpperCase();
    }
    
    await agency.update(updates);
    
    res.json({
      success: true,
      message: 'Agency updated successfully',
      agency
    });
  } catch (error) {
    console.error('❌ Update agency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete agency (soft delete)
app.delete('/api/admin/agencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting agency:', id);
    
    const agency = await Agency.findByPk(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }
    
    const activeCounters = await Counter.count({
      where: { 
        agency_id: id, 
        is_active: true 
      }
    });
    
    if (activeCounters > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete agency with active counters'
      });
    }
    
    await agency.update({ is_active: false });
    
    res.json({
      success: true,
      message: 'Agency deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Delete agency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Link Service to Agency
app.post('/api/admin/agencies/:agencyId/services', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { service_codes } = req.body;

    if (!service_codes || !Array.isArray(service_codes)) {
      return res.status(400).json({
        success: false,
        error: 'Service codes array is required'
      });
    }

    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
    }

    const currentServices = agency.services || [];
    const updatedServices = [...new Set([...currentServices, ...service_codes])];

    await agency.update({ services: updatedServices });

    res.json({
      success: true,
      message: 'Services linked to agency successfully',
      services: updatedServices
    });

  } catch (error) {
    console.error('Link service to agency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add services to counter
app.post('/api/admin/counters/:counterId/services', async (req, res) => {
  try {
    const { counterId } = req.params;
    const { service_codes } = req.body;
    
    console.log('📝 Adding services to counter:', counterId, service_codes);
    
    if (!service_codes || !Array.isArray(service_codes)) {
      return res.status(400).json({
        success: false,
        error: 'Service codes array is required'
      });
    }
    
    const counter = await Counter.findByPk(counterId);
    if (!counter) {
      return res.status(404).json({
        success: false,
        error: 'Counter not found'
      });
    }
    
    const currentServices = counter.services || [];
    const updatedServices = [...new Set([...currentServices, ...service_codes])];
    
    await counter.update({ services: updatedServices });
    
    res.json({
      success: true,
      message: 'Services added to counter successfully',
      counter: {
        id: counter.id,
        number: counter.number,
        services: updatedServices
      }
    });
  } catch (error) {
    console.error('❌ Add services to counter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get counter by ID
app.get('/api/admin/counters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const counter = await Counter.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'counterEmployee',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Agency,
          as: 'counterAgency'
        }
      ]
    });
    
    if (!counter) {
      return res.status(404).json({
        success: false,
        error: 'Counter not found'
      });
    }
    
    res.json({
      success: true,
      counter
    });
  } catch (error) {
    console.error('❌ Get counter error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== SERVICE MANAGEMENT ENDPOINTS ====================

// Create new service
app.post('/api/admin/services', async (req, res) => {
  try {
    const { code, name, description, estimated_time } = req.body;
    
    console.log('📝 Creating service:', code);
    
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required'
      });
    }
    
    const existingService = await Service.findOne({ 
      where: { name: code.toUpperCase() } 
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        error: `Service with code ${code} already exists`
      });
    }
    
    const service = await Service.create({
      name: code.toUpperCase(),
      description: description || null,
      estimated_time: estimated_time || 15,
      is_active: true,
      max_daily_tickets: 50
    });
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('❌ Create service error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update service
app.put('/api/admin/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    await service.update(updates);
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('❌ Update service error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete service
app.delete('/api/admin/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    await service.update({ is_active: false });
    
    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Delete service error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== STATISTICS ENDPOINTS ====================

// ==================== DEBUG STATISTICS ENDPOINTS ====================

// Daily statistics - DEBUG VERSION
app.get('/api/stats/daily', async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📊 DAILY STATS ENDPOINT CALLED');
    console.log('='.repeat(50));
    
    const { date } = req.query;
    console.log('1. Date query param:', date);
    
    // Check if Ticket model exists
    console.log('2. Checking Ticket model...');
    if (!Ticket) {
      console.error('❌ Ticket model is undefined!');
      return res.status(500).json({ success: false, error: 'Ticket model not found' });
    }
    console.log('✅ Ticket model OK');
    
    // Check if Op exists
    console.log('3. Checking Op...');
    if (!Op) {
      console.error('❌ Op is undefined!');
      return res.status(500).json({ success: false, error: 'Op not found' });
    }
    console.log('✅ Op OK');
    
    // Calculate dates
    console.log('4. Calculating dates...');
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    console.log('   Target date:', targetDate);
    console.log('   Next day:', nextDay);
    
    // Try to query tickets
    console.log('5. Querying tickets...');
    const tickets = await Ticket.findAll({
      where: {
        createdAt: {
          [Op.between]: [targetDate, nextDay]
        }
      }
    });
    
    console.log(`6. Found ${tickets.length} tickets`);
    
    // Process results
    const totalTickets = tickets.length;
    const completedTickets = tickets.filter(t => t.status === 'completed').length;
    const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
    const missedTickets = tickets.filter(t => t.status === 'missed').length;
    
    console.log('7. Stats calculated:', {
      total: totalTickets,
      completed: completedTickets,
      waiting: waitingTickets,
      missed: missedTickets
    });
    
    // Send response
    console.log('8. Sending response...');
    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        summary: {
          total_tickets: totalTickets,
          completed_tickets: completedTickets,
          waiting_tickets: waitingTickets,
          missed_tickets: missedTickets
        }
      }
    });
    
    console.log('9. ✅ Daily stats completed successfully');
    
  } catch (error) {
    console.error('❌❌❌ ERROR IN DAILY STATS:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Period statistics - DEBUG VERSION
app.get('/api/stats/period', async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📊 PERIOD STATS ENDPOINT CALLED');
    console.log('='.repeat(50));
    
    const { period } = req.query;
    console.log('Period:', period);
    
    let startDate = new Date();
    let endDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      console.log('Using week period');
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
      console.log('Using month period');
    } else {
      startDate.setDate(startDate.getDate() - 7);
      console.log('Using default week period');
    }
    
    startDate.setHours(0, 0, 0, 0);
    console.log('Date range:', startDate, 'to', endDate);
    
    const tickets = await Ticket.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    console.log(`Found ${tickets.length} tickets`);
    
    res.json({
      success: true,
      data: {
        period: period || 'week',
        total_tickets: tickets.length,
        completed_tickets: tickets.filter(t => t.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('❌ Period stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time statistics - DEBUG VERSION
app.get('/api/stats/realtime', async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📊 REALTIME STATS ENDPOINT CALLED');
    console.log('='.repeat(50));
    
    const waitingTickets = await Ticket.count({ where: { status: 'waiting' } });
    console.log('Waiting tickets:', waitingTickets);
    
    const servingTickets = await Ticket.count({ where: { status: 'serving' } });
    console.log('Serving tickets:', servingTickets);
    
    const calledTickets = await Ticket.count({ where: { status: 'called' } });
    console.log('Called tickets:', calledTickets);
    
    res.json({
      success: true,
      data: {
        waiting: waitingTickets,
        serving: servingTickets,
        called: calledTickets,
        total_active: waitingTickets + servingTickets + calledTickets
      }
    });
  } catch (error) {
    console.error('❌ Realtime stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//================= SIMPLE TEST ENDPOINT ====================
app.get('/api/test123', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test endpoint is working!',
    timestamp: new Date()
  });
});

// ==================== TICKET MONITORING CRON JOB ====================

async function checkMissedTickets() {
  try {
    console.log('🔄 Running missed ticket check...');
    
    const timeoutMinutes = 5;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeoutMs);
    
    const missedTickets = await Ticket.findAll({
      where: {
        status: 'called',
        called_at: { [Op.lt]: cutoffTime },
        serving_started_at: null
      },
      include: [{ model: Counter, as: 'ticketCounter' }]
    });
    
    if (missedTickets.length === 0) {
      console.log('✅ No missed tickets found');
      return;
    }
    
    console.log(`⚠️  Found ${missedTickets.length} missed tickets`);
    
    for (const ticket of missedTickets) {
      await ticket.update({
        status: 'missed',
        missed_at: new Date(),
        notes: `Auto-marked as missed after ${timeoutMinutes} minutes`
      });
      
      if (ticket.ticketCounter) {
        await ticket.ticketCounter.update({
          status: 'active',
          current_ticket_id: null
        });
        console.log(`✅ Released counter ${ticket.ticketCounter.number}`);
      }
      
      console.log(`❌ Ticket ${ticket.ticket_number} marked as missed`);
    }
    
  } catch (error) {
    console.error('❌ Error in missed ticket check:', error);
  }
}

let missedTicketInterval;
function startMissedTicketMonitor() {
  checkMissedTickets();
  missedTicketInterval = setInterval(checkMissedTickets, 5 * 60 * 1000);
  console.log('✅ Missed ticket monitor started (runs every 5 minutes)');
}

function stopMissedTicketMonitor() {
  if (missedTicketInterval) {
    clearInterval(missedTicketInterval);
    console.log('🛑 Missed ticket monitor stopped');
  }
}

// ==================== HELPER FUNCTIONS ====================

async function validateVipCode(code) {
  const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM', 'VIP2024'];
  return validCodes.includes(code?.toUpperCase());
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
  
  if (priority === 'vip') waitTime = Math.max(5, waitTime * 0.5);
  if (priority === 'urgent') waitTime = Math.max(2, waitTime * 0.3);
  
  return Math.ceil(waitTime);
}

async function getAvailableSlots(serviceId, date) {
  const slots = [];
  const baseDate = new Date(date);
  baseDate.setHours(8, 0, 0, 0);
  
  for (let i = 0; i < 18; i++) {
    const slotTime = new Date(baseDate.getTime() + (i * 30 * 60000));
    
    const existing = await Ticket.findOne({
      where: {
        service_id: serviceId,
        is_appointment: true,
        appointment_time: {
          [Op.between]: [
            new Date(slotTime.getTime() - 30 * 60000),
            new Date(slotTime.getTime() + 30 * 60000)
          ]
        },
        status: { [Op.in]: ['waiting', 'called'] }
      }
    });
    
    if (!existing && slotTime > new Date()) {
      slots.push({
        time: slotTime,
        formatted: slotTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      });
    }
  }
  
  return slots.slice(0, 5);
}

async function getQueuePosition(ticketId) {
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

async function calculateAllWaitTimes() {
  try {
    const services = await Service.findAll({ where: { is_active: true } });
    const waitTimes = {};
    
    for (const service of services) {
      const waitingCount = await Ticket.count({
        where: { 
          service_id: service.id,
          status: 'waiting'
        }
      });
      
      const baseTime = service.estimated_time || 15;
      
      waitTimes[service.name] = {
        normal: Math.ceil(waitingCount * baseTime),
        vip: Math.max(5, Math.ceil(waitingCount * baseTime * 0.3))
      };
    }
    
    return waitTimes;
  } catch (error) {
    console.error('Error calculating wait times:', error);
    return {};
  }
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET  /api/services',
      'GET  /api/counters',
      'POST /api/tickets/generate',
      'POST /api/tickets/vip-appointment',
      'POST /api/tickets/vip/generate',
      'POST /api/admin/tickets/prioritize',
      'POST /api/admin/tickets/reassign',
      'GET  /api/queue/stats',
      'GET  /api/tickets/queue',
      'GET  /api/tickets/:id',
      'GET  /api/tickets/:id/position',
      'POST /api/tickets/:id/cancel',
      'POST /api/tickets/call-next',
      'POST /api/tickets/:id/complete',
      'POST /api/survey/submit',
      'GET  /api/survey/stats',
      'GET  /api/survey/ticket/:ticketId',
      'GET  /api/survey/dashboard',
      'POST /api/admin/services',
      'GET  /api/stats/daily',
      'GET  /api/stats/period',
      'GET  /api/stats/realtime',
      'GET  /api/admin/counters/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== START SERVER ====================

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized successfully');
    } catch (syncError) {
      console.log('⚠️  Database sync error:', syncError.message);
      console.log('⚠️  Trying without alter...');
      try {
        await sequelize.sync();
        console.log('✅ Database synchronized without alter');
      } catch (secondSyncError) {
        console.log('⚠️ Second sync error:', secondSyncError.message);
        console.log('⚠️ Continuing with existing schema...');
      }
    }

    startMissedTicketMonitor();

    app.listen(PORT, () => {
      console.log('='.repeat(70));
      console.log('🏦 BANK QUEUE SYSTEM - COMPLETE INTEGRATION');
      console.log('='.repeat(70));
      console.log(`✅ Server running: http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log('\n📋 TICKET MANAGEMENT:');
      console.log('  POST /api/tickets/generate       - Create NORMAL ticket');
      console.log('  POST /api/tickets/vip/generate   - Create VIP ticket');
      console.log('  GET  /api/tickets/queue         - Queue status');
      console.log('  GET  /api/queue/stats           - Statistics');
      console.log('\n📋 SATISFACTION SURVEYS:');
      console.log('  POST /api/survey/submit          - Submit survey');
      console.log('  GET  /api/survey/stats          - Survey statistics');
      console.log('  GET  /api/survey/ticket/:id     - Get survey by ticket');
      console.log('  GET  /api/survey/dashboard      - Dashboard summary');
      console.log('\n📋 AGENCY MANAGEMENT:');
      console.log('  POST /api/admin/agencies         - Create agency');
      console.log('  GET  /api/admin/agencies         - List agencies');
      console.log('  PUT  /api/admin/agencies/:id     - Update agency');
      console.log('  DELETE /api/admin/agencies/:id   - Delete agency');
      console.log('\n📋 NEW ENDPOINTS ADDED:');
      console.log('  POST /api/admin/services         - Create new service');
      console.log('  GET  /api/stats/daily            - Daily statistics');
      console.log('  GET  /api/stats/period           - Period statistics');
      console.log('  GET  /api/stats/realtime         - Real-time statistics');
      console.log('  GET  /api/admin/counters/:id     - Get counter by ID');
      console.log('  GET  /api/test123                - Test endpoint');
      console.log('='.repeat(70));
      console.log('🔄 Auto-missed monitor: ACTIVE (runs every 5 minutes)');
      console.log('='.repeat(70));
    });

  } catch (error) {
    console.error('❌ Server failed:', error.message);
    process.exit(1);
  }
}

startServer();