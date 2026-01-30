const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const employeeController = require('../controllers/employeeController');
const adminController = require('../controllers/adminController');
const statsController = require('../controllers/statsController');
const queueController = require('../controllers/queueController');
const serviceController = require('../controllers/serviceController');
const counterController = require('../controllers/counterController');
// Import middlewares
const { authMiddleware } = require('../middlewares/auth');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// ==================== PUBLIC ROUTES ====================
router.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Bank Queue Management System API',
    version: '2.0.0',
    status: '✅ Online'
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Public ticket routes
router.post('/tickets/generate', queueController.generateTicket);
router.get('/tickets/queue-status', queueController.getQueueStatus);
router.get('/tickets/display', queueController.getNextDisplayTickets);

// ==================== CLIENT ROUTES ====================
router.get('/client/profile', authMiddleware, authController.getProfile);
router.put('/client/profile', authMiddleware, authController.updateProfile);
router.get('/client/tickets', authMiddleware, ticketController.getClientTickets);

// ==================== EMPLOYEE ROUTES ====================
router.get('/employee/dashboard', 
  authMiddleware, 
  roleMiddleware('employee', 'admin', 'super_admin'),
  employeeController.getDashboard
);

router.post('/employee/call-next', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  employeeController.callNextTicket
);

router.post('/employee/start-serving', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  employeeController.startServing
);

router.post('/employee/complete', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  employeeController.completeService
);

router.get('/employee/queue', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  queueController.getQueueStatus
);

// ==================== ADMIN ROUTES ====================
router.get('/admin/dashboard', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.getDashboard
);

router.get('/admin/users', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.getUsers
);

router.post('/admin/users', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.createUser
);

router.put('/admin/users/:id', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.updateUser
);

router.delete('/admin/users/:id', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.deleteUser
);

router.get('/admin/services', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.getServices
);

router.post('/admin/services', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.createService
);

router.get('/admin/counters', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.getCounters
);

router.post('/admin/counters/assign', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.assignEmployeeToCounter
);

router.post('/admin/reports', 
  authMiddleware,
  roleMiddleware('admin', 'super_admin'),
  adminController.generateReport
);

// ==================== STATISTICS ROUTES ====================
router.get('/stats/daily', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  statsController.getDailyStats
);

router.get('/stats/period', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  statsController.getPeriodStats
);

router.get('/stats/realtime', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  statsController.getRealTimeStats
);

// ==================== TICKET MANAGEMENT ROUTES ====================
router.post('/tickets/cancel', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  queueController.cancelTicket
);

router.post('/tickets/transfer', 
  authMiddleware,
  roleMiddleware('employee', 'admin', 'super_admin'),
  queueController.transferTicket
);

// ==================== 404 HANDLER ====================
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = router;