// routes/priorityRoutes.js
const express = require('express');
const router = express.Router();
const priorityController = require('../controllers/priorityController');
const { authMiddleware } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roles');

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// Prioritize ticket
router.post('/prioritize/:ticketId', priorityController.prioritizeTicket);

// Reassign ticket to different counter
router.post('/reassign/:ticketId', priorityController.reassignTicket);

// Skip ticket (mark as missed)
router.post('/skip/:ticketId', priorityController.skipTicket);

// Analyze queue for optimization
router.get('/queue-analysis', priorityController.analyzeQueue);

module.exports = router;