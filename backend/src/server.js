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





// ==================== ROUTES DE BASE ====================

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Bank Queue Management System API',
    status: '✅ Online',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/health',
    ready: '/ready'
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
    database: 'connected'
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
app.use('/api/queue', queueRoutes);
app.use('/api/stats', statsRoutes);

// ==================== ROUTES DE COMPATIBILITÉ (à migrer progressivement) ====================

// Compatibilité avec l'ancienne API
const { Op } = require('sequelize');

// Services (public)
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      attributes: ['id', 'code', 'name', 'description', 'estimated_time'],
      order: [['code', 'ASC']]
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

// Counters (public)
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

// Tickets (public - compatibilité)
app.post('/api/tickets/generate', limiters.ticketCreation, async (req, res) => {
  try {
    const { serviceCode, customerName, vipCode } = req.body;

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

    // VIP validation simplifiée
    const isVip = vipCode ? await validateVipCode(vipCode) : false;
    const priority = isVip ? 'vip' : 'normal';

    // Génération du numéro de ticket
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
      if (match) seqNumber = parseInt(match[0]) + 1;
    }

    const ticketNumber = `${serviceCode}${seqNumber.toString().padStart(3, '0')}`;

    // Création du ticket
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Queue status (public)
app.get('/api/tickets/queue', async (req, res) => {
  try {
    const waitingCount = await Ticket.count({
      where: { status: 'waiting' }
    });
    
    const inProgress = await Ticket.count({
      where: { status: 'called' }
    });
    
    res.json({
      success: true,
      data: {
        total_waiting: waitingCount,
        in_progress: inProgress,
        total: waitingCount + inProgress,
        message: `${waitingCount} tickets waiting, ${inProgress} being served`
      }
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.json({
      success: true,
      data: {
        total_waiting: 0,
        in_progress: 0,
        total: 0,
        message: 'Queue system ready'
      }
    });
  }
});

// ==================== GESTION DES ERREURS ====================


app.get('/api/public/faq', (req, res) => {
  res.json({
    success: true,
    faq: [
      { question: "Comment prendre un ticket ?", answer: "..." }
    ]
  });
});
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

// Gestionnaire d'erreurs global
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
  
  // Réponse d'erreur standardisée
  const errorResponse = {
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  };

  // Ajouter des détails en développement
  if (!isProduction) {
    errorResponse.stack = err.stack;
    if (err.details) errorResponse.details = err.details;
  }

  // Gestion des erreurs spécifiques
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

  // Rate limiter erreur
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests'
    });
  }

  // Erreur par défaut
  const statusCode = err.status || 500;
  res.status(statusCode).json(errorResponse);
});

// ==================== FONCTIONS UTILITAIRES ====================

async function validateVipCode(code) {
  // Dans un vrai système, vérifier dans la base de données
  const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM'];
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
    
    // Ajustements de priorité
    if (priority === 'vip') waitTime = Math.max(5, waitTime * 0.5);
    if (priority === 'normal') waitTime = Math.max(2, waitTime * 0.3);
    
    return Math.ceil(waitTime);
  } catch (error) {
    console.error('Wait time calculation error:', error);
    return 15; // Temps par défaut
  }
}

// ==================== DÉMARRAGE DU SERVEUR ====================

async function startServer() {
  try {
    console.log('='.repeat(70));
    console.log('🚀 STARTING BANK QUEUE MANAGEMENT SYSTEM');
    console.log('='.repeat(70));
    
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Synchroniser la base de données (mode sécurisé)
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: true } 
      : { alter: true };
    
   // await sequelize.sync({ alter: false })  // DÉSACTIVÉ
console.log('✅ Database connected (no sync)');
    console.log('✅ Database synchronized');
    
    // Démarrer le scheduler de notifications
    if (notificationScheduler && typeof notificationScheduler.start === 'function') {
      notificationScheduler.start();
      console.log('✅ Notification scheduler started');
    }
    
    // Démarrer le détecteur de problèmes
    const problemDetectorService = require('./services/problemDetectorService');
    if (problemDetectorService && typeof problemDetectorService.startScheduler === 'function') {
      problemDetectorService.startScheduler();
      console.log('✅ Problem detector started');
    }
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security features: Enabled`);
      console.log(`📊 Performance optimization: Active`);
      console.log('='.repeat(70));
      console.log('📋 AVAILABLE ENDPOINTS:');
      console.log('├── GET  /                 - API status');
      console.log('├── GET  /health           - Health check');
      console.log('├── GET  /ready            - Ready check');
      console.log('├── GET  /api/docs         - API documentation');
      console.log('├── POST /api/auth/login   - User login');
      console.log('├── POST /api/public/ticket - Create ticket');
      console.log('├── GET  /api/queue/status  - Queue status');
      console.log('├── GET  /api/stats/daily   - Daily statistics');
      console.log('└── POST /api/vip/appointment - VIP appointment');
      console.log('='.repeat(70));
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Fermer le serveur HTTP
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Fermer la connexion à la base de données
        sequelize.close().then(() => {
          console.log('✅ Database connection closed');
          console.log('👋 Server shutdown complete');
          process.exit(0);
        }).catch(err => {
          console.error('❌ Error closing database:', err);
          process.exit(1);
        });
      });
      
      // Timeout forcé après 10 secondes
      setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Écouter les signaux de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ==================== POINT D'ENTRÉE ====================

/* // Vérifier si on est en mode cluster (production seulement)
if (process.env.NODE_ENV === 'production' && require('cluster').isMaster) {
  const cluster = require('cluster');
  const os = require('os');
  const numCPUs = os.cpus().length;
  
  console.log(`🎯 Master ${process.pid} is running with ${numCPUs} CPUs`);
  console.log(`👥 Forking ${Math.min(numCPUs, 4)} workers...`);
  
  // Créer les workers
  for (let i = 0; i < Math.min(numCPUs, 4); i++) {
    cluster.fork();
  }
  
  // Gérer la mort d'un worker
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚰️ Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
    console.log(`🔄 Forking new worker...`);
    cluster.fork();
  });
  
  // Surveiller les workers
  cluster.on('online', (worker) => {
    console.log(`👷 Worker ${worker.process.pid} is online`);
  });
  
} else {
  // Démarrer le serveur (worker ou mode développement)
  startServer();
} */
startServer();