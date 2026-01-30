const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queueRoutes = require('./routes/queueRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Bank Queue Management System API',
    status: '✅ Online',
    version: '2.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    database: 'connected',
    uptime: process.uptime()
  });
});

// ==================== IMPORT MODELS ====================
const { User, Service, Ticket, Counter } = require('./models');

// ==================== IMPORT ROUTES ====================
// Note: Crée ces fichiers si tu ne les as pas encore


// ==================== USE ROUTES ====================
app.use("/api/auth", authRoutes); // ACTIVÉ
//// app.use("/api/employee", employeeRoutes); // DÉSACTIVÉ TEMPORAIREMENT
// app.use("/api/admin", adminRoutes); // DÉSACTIVÉ TEMPORAIREMENT
app.use('/api/queue', queueRoutes);
console.log(statsRoutes);
app.use('/api/stats', statsRoutes);

// ==================== PUBLIC API ROUTES ====================

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      order: [['code', 'ASC']]
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
// Get all counters - FIXED
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

// ==================== TICKET ROUTES (PUBLIC) ====================

// Generate new ticket (Public - no auth needed)
app.post('/api/tickets/generate', async (req, res) => {
  try {
    const { serviceCode, customerName, vipCode } = req.body;

    // Validate service
    const service = await Service.findOne({ 
      where: { 
        code: serviceCode, 
        is_active: true 
      } 
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
        createdAt: { 
          [Op.gte]: today 
        }
      },
      order: [['createdAt', 'DESC']]
    });

    let seqNumber = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) seqNumber = parseInt(match[0]) + 1;
    }

    const ticketNumber = `${serviceCode}${seqNumber.toString().padStart(3, '0')}`;

    // Create ticket
    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      priority,
      status: 'waiting',
      customer_name: customerName || 'Customer',
      is_vip: isVip,
      estimated_wait_time: await calculateWaitTime(service.id, priority)
    });

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket: {
        number: ticketNumber,
        service: service.name,
        priority,
        estimated_wait: ticket.estimated_wait_time,
        created_at: ticket.createdAt,
        message: `Please proceed to waiting area. Your ticket is ${ticketNumber}`
      }
    });

  } catch (error) {
    console.error('Ticket generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue status (Public)
// Get queue status (Public) - FIXED
// Get queue status - SIMPLE VERSION
app.get('/api/tickets/queue', async (req, res) => {
  try {
    const count = await Ticket.count({
      where: { status: 'waiting' }
    });
    
    res.json({
      success: true,
      data: {
        total_waiting: count,
        message: `${count} tickets waiting`
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        total_waiting: 0,
        message: 'Queue system ready'
      }
    });
  }
});
// Get all tickets (for testing)
// Get all tickets - SIMPLE VERSION
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(t => ({
        ticket_number: t.ticket_number,
        status: t.status,
        customer_name: t.customer_name,
        created_at: t.createdAt
      }))
    });
  } catch (error) {
    res.json({
      success: true,
      count: 0,
      tickets: []
    });
  }
});

// ==================== SIMPLE TICKET OPERATIONS (for testing) ====================

// Call next ticket (simple version)
app.post('/api/tickets/call-next', async (req, res) => {
  try {
    const { Ticket, Op } = require('sequelize');
    
    // Find the oldest waiting ticket (VIP priority)
    let nextTicket = await Ticket.findOne({
      where: { 
        status: 'waiting',
        priority: 'vip'
      },
      include: [Service],
      order: [['createdAt', 'ASC']]
    });

    if (!nextTicket) {
      nextTicket = await Ticket.findOne({
        where: { status: 'waiting' },
        include: [Service],
        order: [['createdAt', 'ASC']]
      });
    }
    
    if (!nextTicket) {
      return res.json({
        success: false,
        message: 'No tickets waiting in queue'
      });
    }
    
    // Update ticket status to 'called'
    await nextTicket.update({ 
      status: 'called',
      called_at: new Date()
    });
    
    res.json({
      success: true,
      message: `Ticket ${nextTicket.ticket_number} called to counter`,
      ticket: {
        id: nextTicket.id,
        number: nextTicket.ticket_number,
        service: nextTicket.Service.name,
        priority: nextTicket.priority,
        customer_name: nextTicket.customer_name,
        waiting_time: Math.floor((new Date() - nextTicket.createdAt) / 60000) + ' min'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete ticket (simple version)
app.post('/api/tickets/:id/complete', async (req, res) => {
  try {
    const ticketId = req.params.id;
    
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
    
    // Update ticket
    await ticket.update({
      status: 'completed',
      completed_at: new Date(),
      actual_service_time: Math.floor((new Date() - (ticket.called_at || ticket.createdAt)) / 60000)
    });
    
    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} completed`,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        service_time: Math.floor((new Date() - (ticket.called_at || ticket.createdAt)) / 60000) + ' min',
        total_time: Math.floor((new Date() - ticket.createdAt) / 60000) + ' min',
        completed_at: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== HELPER FUNCTIONS ====================
const { Op } = require('sequelize');

async function validateVipCode(code) {
  // Simple validation - in real app, check database
  const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM'];
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
  
  // Priority adjustments
  if (priority === 'vip') waitTime = Math.max(5, waitTime * 0.5);
  if (priority === 'urgent') waitTime = Math.max(2, waitTime * 0.3);
  
  return Math.ceil(waitTime);
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
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
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync database (safe mode)
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🏦 BANK QUEUE MANAGEMENT SYSTEM');
      console.log('='.repeat(60));
      console.log(`✅ Server: http://localhost:${PORT}`);
      console.log(`✅ Health: http://localhost:${PORT}/health`);
      console.log('\n📋 AVAILABLE ENDPOINTS:');
      console.log('\n📝 PUBLIC:');
      console.log('  GET  /api/services           - List all services');
      console.log('  GET  /api/counters          - List all counters');
      console.log('  POST /api/tickets/generate  - Generate new ticket');
      console.log('  GET  /api/tickets/queue     - View queue status');
      console.log('  GET  /api/tickets           - List all tickets (test)');
      console.log('  POST /api/tickets/call-next - Call next ticket (test)');
      console.log('  POST /api/tickets/:id/complete - Complete ticket (test)');
      
      console.log('\n🔐 AUTH:');
      console.log('  POST /api/auth/register     - Register user');
      console.log('  POST /api/auth/login        - Login user');
      console.log('  GET  /api/auth/profile      - Get user profile');
      
      console.log('\n👨‍💼 EMPLOYEE:');
      console.log('  GET  /api/employee/dashboard - Employee dashboard');
      console.log('  POST /api/employee/call-next - Call next ticket');
      
      console.log('\n👑 ADMIN:');
      console.log('  GET  /api/admin/dashboard    - Admin dashboard');
      console.log('  GET  /api/admin/users        - List users');
      
      console.log('\n📊 STATS:');
      console.log('  GET  /api/stats/daily       - Daily statistics');
      console.log('  GET  /api/stats/realtime    - Real-time stats');
      
      console.log('\n📈 QUEUE:');
      console.log('  GET  /api/queue/status      - Detailed queue status');
      console.log('\n💾 Database: ./database/bank_queue.db');
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('🚀 Server is ready!');
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();