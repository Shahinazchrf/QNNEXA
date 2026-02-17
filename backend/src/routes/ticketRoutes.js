// routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketManagementController = require('../controllers/ticketManagementController');
const authMiddleware = require('../middlewares/authMiddleware'); // Changed from 'middleware' to 'middlewares'

console.log('✅ ticketRoutes.js LOADED WITH CORRECT PATHS');

// Public routes (no authentication needed)
router.post('/normal', ticketManagementController.createNormalTicket);
router.get('/status', ticketManagementController.getTicketStatus);
router.get('/queue-stats', ticketManagementController.getQueueStatistics);

// Client routes (require authentication)
router.post('/vip', authMiddleware, ticketManagementController.createVIPTicket);
router.post('/cancel', authMiddleware, ticketManagementController.cancelTicket);

// Admin routes (require admin role)
router.put('/prioritize', authMiddleware.requireRole(['admin', 'super_admin']), ticketManagementController.prioritizeTicket);
router.put('/reassign', authMiddleware.requireRole(['admin', 'super_admin']), ticketManagementController.reassignTicket);

module.exports = router;
