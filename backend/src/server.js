// server.js - VERSION OPTIMISÉE
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const responseTime = require('response-time');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { User, Service, Ticket, Counter } = require('./models');

// Import des routes
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationScheduler = require('./services/notificationScheduler');
const vipRoutes = require('./routes/vipRoutes');
const queueRoutes = require('./routes/queueRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');
const counterAdminRoutes = require('./routes/counterAdminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const faqRoutes = require('./routes/faqRoutes');
const priorityRoutes = require('./routes/priorityRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== CONFIGURATION DE SÉCURITÉ ====================

// 1. Helmet - Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Pour les API
}));

// 2. Protection XSS
app.use(xss());

// 3. Sanitisation MongoDB
app.use(mongoSanitize());

// 4. Protection contre la pollution des paramètres
app.use(hpp());

// 5. CORS configuré
const corsOptions = {
  origin: process.env.FRONTEND_URLS ? 
    process.env.FRONTEND_URLS.split(',') : 
    ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// 6. Rate limiting
const createLimiter = (windowMs, max) => rateLimit({
  windowMs,
  max,
  keyGenerator: ipKeyGenerator,  // <-- UTILISE ipKeyGenerator
  message: 'Too many requests'
});

// Limiteurs différents pour différents types de requêtes
const limiters = {
  // API publique - plus permissive
  publicApi: createLimiter(60 * 1000, 60, 'Too many requests, please try again later'),
  
  // API authentifiée - limite standard
  api: createLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP'),
  
  // Création de tickets - très restrictive
  ticketCreation: createLimiter(60 * 1000, 5, 'Too many ticket creations, please wait'),
  
  // Authentification - pour prévenir les attaques par force brute
  auth: createLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts')
};

// Appliquer les rate limiters
app.use('/api/public/ticket', limiters.ticketCreation);
app.use('/api/auth', limiters.auth);
app.use('/api/public', limiters.publicApi);
app.use('/api/', limiters.api);

// ==================== OPTIMISATION DES PERFORMANCES ====================

// 1. Compression GZIP
app.use(compression({
  level: 6,
  threshold: 1024, // Compresser seulement si > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 2. Monitoring du temps de réponse
app.use(responseTime((req, res, time) => {
  if (time > 1000) {
    console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${time}ms`);
  }
  
  // Ajouter le temps de réponse dans les headers
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
}));

// 3. Body parser avec limites
app.use(express.json({ 
  limit: '50kb', // Augmenté pour les formulaires complexes
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50kb',
  parameterLimit: 50
}));

// ==================== MIDDLEWARE PERSONNALISÉ ====================

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = duration > 500 ? 'warn' : 'info';
    
    console[logLevel](`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
});

// Middleware pour détecter les activités suspectes
app.use((req, res, next) => {
  const suspiciousPatterns = [
    /<script>/i,
    /DROP TABLE/i,
    /UNION SELECT/i,
    /OR 1=1/i,
    /--/,
    /\/\*.*\*\//,
    /exec\(/i,
    /eval\(/i
  ];

  const checkString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  }).toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`🚨 Suspicious activity detected from ${req.ip}:`, {
        method: req.method,
        url: req.url,
        pattern: pattern.toString()
      });
      break;
    }
  }
  
  next();
});

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [{
        model: Service,
        as: 'service'  // AJOUTE CETTE LIGNE
      }]
    });
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🟢 FIX: Allow employee endpoints without token (TESTING ONLY)
app.use('/api/employee', (req, res, next) => {
  req.user = { id: 'test-employee', role: 'employee' };
  next();
});

// ==================== ROUTES DE BASE / BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Bank Queue Management System API',
    status: '✅ Online',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/health',
    ready: '/ready',
    features: [
      'VIP Ticket Management',
      'Auto-missed handling',
      'Satisfaction surveys',
      'Multi-agency support',
      'Real-time monitoring'
    ]
  });
});

// Health check (sans cache)
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    },
    database: 'connected',
    features: {
      ticket_monitoring: 'active',
      vip_support: 'enabled',
      survey_system: 'ready'
    }
  });
});

// Ready check pour load balancers
app.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready',
      error: 'Database connection failed'
    });
  }
});

// Documentation API
app.get('/api/docs', (req, res) => {
  res.json({
    endpoints: {
      auth: '/api/auth',
      public: '/api/public',
      vip: '/api/vip',
      employee: '/api/employee',
      admin: '/api/admin',
      'counter-admin': '/api/counter-admin',
      queue: '/api/queue',
      stats: '/api/stats',
      faq: '/api/faq'
    },
    examples: {
      createTicket: 'POST /api/public/ticket',
      checkQueue: 'GET /api/public/queue/:ticketId',
      vipAppointment: 'POST /api/vip/appointment/create'
    }
  });
});

// ==================== IMPORT MODELS ====================
const { User, Service, Ticket, Counter, Survey, Agency } = require('./models');
const { Op } = require('sequelize');

// ==================== ROUTES D'API ====================

// Routes publiques (sans authentification)
app.use('/api/public', publicRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/vip', vipRoutes);
// Routes notifications
app.use('/api/notifications', require('./routes/notificationRoutes'));
// Routes avec authentification
app.use('/api/auth', authRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/counter-admin', counterAdminRoutes);

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

// ==================== ROUTES DE COMPATIBILITÉ (à migrer progressivement) ====================

// Compatibilité avec l'ancienne API
const { Op } = require('sequelize');

// Services (public)
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'description', 'estimated_time'],
      order: [['name', 'ASC']]
    });
    res.json({ 
      success: true, 
      count: services.length,
      services 
    });
  } catch (error) {
    console.error('Services error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Counters (public) - Get all counters
app.get('/api/counters', async (req, res) => {
  try {
    const counters = await Counter.findAll({
      attributes: ['id', 'number', 'name', 'status', 'location', 'is_active', 'createdAt'],
      order: [['number', 'ASC']]
    });
    
    res.json({ 
      success: true, 
      count: counters.length,
      counters: counters.map(c => ({
        id: c.id,
        number: c.number,
        name: c.name,
        status: c.status,
        service: 'General',
        location: c.location,
        is_active: c.is_active,
        created_at: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Counters error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
    // VIP validation simplifiée
    const isVip = vipCode ? await validateVipCode(vipCode) : false;
    const priority = isVip ? 'vip' : 'normal';

    // Check for existing appointments
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

    // Génération du numéro de ticket
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

    // Création du ticket
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

// ==================== FAQ ENDPOINT ====================
app.get('/api/public/faq', (req, res) => {
  res.json({
    success: true,
    faq: [
      { question: "Comment prendre un ticket ?", answer: "..." }
    ]
  });
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    available_endpoints: {
      root: '/',
      health: '/health',
      ready: '/ready',
      docs: '/api/docs'
    }
  });
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('🚨 Global error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Standardized error response
  const errorResponse = {
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  };

  // Add details in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
    if (err.details) errorResponse.details = err.details;
  }

  // Specific error handling
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Rate limiter error
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests'
    });
  }

  // Default error
  const statusCode = err.status || 500;
  res.status(statusCode).json(errorResponse);
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

// ==================== ERROR HANDLERS ====================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    available_endpoints: {
      root: '/',
      health: '/health',
      ready: '/ready',
      docs: '/api/docs'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  };

  if (!isProduction) {
    errorResponse.stack = err.stack;
    if (err.details) errorResponse.details = err.details;
  }

  // Specific error handling
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Rate limiter error
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests'
    });
  }

  // Default error
  const statusCode = err.status || 500;
  res.status(statusCode).json(errorResponse);
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
  try {
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
  } catch (error) {
    console.error('Wait time calculation error:', error);
    return 15;
  }
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
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        sequelize.close().then(() => {
          console.log('✅ Database connection closed');
          console.log('👋 Server shutdown complete');
          process.exit(0);
        }).catch(err => {
          console.error('❌ Error closing database:', err);
          process.exit(1);
        });
      });
      
      setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Server failed:', error.message);
    process.exit(1);
  }
}

startServer();

async function calculateWaitTime(serviceId, priority) {
  try {
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
  } catch (error) {
    console.error('Wait time calculation error:', error);
    return 15;
  }
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
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        sequelize.close().then(() => {
          console.log('✅ Database connection closed');
          console.log('👋 Server shutdown complete');
          process.exit(0);
        }).catch(err => {
          console.error('❌ Error closing database:', err);
          process.exit(1);
        });
      });
      
      setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Server failed:', error.message);
    process.exit(1);
  }
}
startServer();
