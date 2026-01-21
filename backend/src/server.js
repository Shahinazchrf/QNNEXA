const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bank Queue API', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Routes API
app.get('/api/services', async (req, res) => {
  const { Service } = require('./models');
  const services = await Service.findAll();
  res.json({ success: true, services });
});

app.get('/api/counters', async (req, res) => {
  const { Counter } = require('./models');
  const counters = await Counter.findAll();
  res.json({ success: true, counters });
});

// ==================== TICKET ROUTES ====================

// Get all tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const tickets = await Ticket.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const ticket = await Ticket.create({
      ticket_number: 'T' + Date.now(),
      status: 'waiting'
    });
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Call the next waiting ticket (FIFO system)
app.post('/api/tickets/call-next', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    
    // Find the oldest waiting ticket
    const nextTicket = await Ticket.findOne({
      where: { status: 'waiting' },
      order: [['createdAt', 'ASC']] // First In, First Out
    });
    
    if (!nextTicket) {
      return res.json({
        success: false,
        message: 'No tickets waiting in queue'
      });
    }
    
    // Update ticket status to 'serving'
    await nextTicket.update({ status: 'serving' });
    
    res.json({
      success: true,
      message: `Ticket ${nextTicket.ticket_number} called to counter`,
      ticket: nextTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete a ticket service
app.post('/api/tickets/:id/complete', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const ticketId = req.params.id;
    
    // Find the ticket by ID
    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.status !== 'serving') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not currently being served'
      });
    }
    
    // Update ticket status to 'completed' and add completion time
    await ticket.update({
      status: 'completed',
      completed_at: new Date()
    });
    
    res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} service completed`,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== QUEUE ROUTES ====================

// Get current queue status
app.get('/api/queues', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const waiting = await Ticket.count({ where: { status: 'waiting' } });
    const serving = await Ticket.count({ where: { status: 'serving' } });
    const completed = await Ticket.count({ where: { status: 'completed' } });
    
    res.json({
      success: true,
      queue_status: {
        waiting,
        serving,
        completed,
        total: waiting + serving + completed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pending tickets only
app.get('/api/queues/pending', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const tickets = await Ticket.findAll({
      where: { status: 'waiting' },
      order: [['createdAt', 'ASC']]
    });
    
    res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== STATS ROUTES ====================

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const total = await Ticket.count();
    const waiting = await Ticket.count({ where: { status: 'waiting' } });
    const serving = await Ticket.count({ where: { status: 'serving' } });
    const completed = await Ticket.count({ where: { status: 'completed' } });
    
    res.json({
      success: true,
      stats: {
        total_tickets: total,
        waiting_now: waiting,
        serving_now: serving,
        completed_today: completed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================
const isAdmin = require('./middlewares/isAdmin');

// Admin statistics dashboard (alias: /api/admin/stats)
app.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const { Ticket, User, Service, Counter } = require('./models');
    
    const [
      totalUsers,
      totalTickets,
      activeServices,
      activeCounters,
      waitingTickets,
      servingTickets,
      completedTickets
    ] = await Promise.all([
      User.count(),
      Ticket.count(),
      Service.count({ where: { is_active: true } }),
      Counter.count({ where: { status: 'active' } }),
      Ticket.count({ where: { status: 'waiting' } }),
      Ticket.count({ where: { status: 'serving' } }),
      Ticket.count({ where: { status: 'completed' } })
    ]);
    
    res.json({
      success: true,
      dashboard: {
        overview: {
          total_users: totalUsers,
          total_tickets: totalTickets,
          active_services: activeServices,
          active_counters: activeCounters
        },
        current_queue: {
          waiting: waitingTickets,
          serving: servingTickets,
          completed: completedTickets,
          total_active: waitingTickets + servingTickets
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin dashboard (same as stats)
app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const { Ticket, User, Service, Counter } = require('./models');
    
    const [
      totalUsers,
      totalTickets,
      activeServices,
      activeCounters,
      waitingTickets,
      servingTickets
    ] = await Promise.all([
      User.count(),
      Ticket.count(),
      Service.count({ where: { is_active: true } }),
      Counter.count({ where: { status: 'active' } }),
      Ticket.count({ where: { status: 'waiting' } }),
      Ticket.count({ where: { status: 'serving' } })
    ]);
    
    res.json({
      success: true,
      dashboard: {
        users: { total: totalUsers },
        tickets: { 
          total: totalTickets,
          waiting: waitingTickets,
          serving: servingTickets 
        },
        services: { active: activeServices },
        counters: { active: activeCounters },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all users (admin view)
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const { User } = require('./models');
    const users = await User.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role } = req.body;
    const { User } = require('./models');
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }
    
    // Create user
    const user = await User.create({
      email,
      password, // Note: In production, use bcrypt to hash!
      first_name,
      last_name,
      phone,
      role: role || 'client'
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { User } = require('./models');
    
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Check password (simple comparison for now)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Update last login
    await user.update({ last_login: new Date() });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token: 'jwt-token-placeholder' // We'll add JWT later
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Profile endpoint
app.get('/api/auth/profile', async (req, res) => {
  try {
    const { User } = require('./models');
    // For now, get first user as example
    const user = await User.findOne({
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'phone']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== START SERVER ====================

// Sync database and start server
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Database tables synchronized');
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🏦 BANK QUEUE MANAGEMENT SYSTEM');
      console.log('='.repeat(60));
      console.log(`✅ Server: http://localhost:${PORT}`);
      console.log(`✅ Health: http://localhost:${PORT}/health`);
      console.log(`✅ Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`✅ Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`✅ Profile: GET http://localhost:${PORT}/api/auth/profile`);
      console.log(`✅ Services: GET http://localhost:${PORT}/api/services`);
      console.log(`✅ Counters: GET http://localhost:${PORT}/api/counters`);
      console.log(`✅ Tickets: GET http://localhost:${PORT}/api/tickets`);
      console.log(`✅ Create Ticket: POST http://localhost:${PORT}/api/tickets`);
      console.log(`✅ Call Next: POST http://localhost:${PORT}/api/tickets/call-next`);
      console.log(`✅ Complete: POST http://localhost:${PORT}/api/tickets/:id/complete`);
      console.log(`✅ Queue: GET http://localhost:${PORT}/api/queues`);
      console.log(`✅ Stats: GET http://localhost:${PORT}/api/stats`);
      console.log(`✅ Admin Stats: GET http://localhost:${PORT}/api/admin/stats (with x-admin-token header)`);
      console.log(`✅ Admin Users: GET http://localhost:${PORT}/api/admin/users (with x-admin-token header)`);
      console.log(`💾 Database: ./database/bank_queue.db`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('🚀 Ready for development!');
      console.log('='.repeat(60));
    });
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  });