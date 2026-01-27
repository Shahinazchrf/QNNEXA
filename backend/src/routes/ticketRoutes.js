const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// PUBLIC ROUTES - No auth needed
router.post('/generate', ticketController.generateTicket);
router.get('/queue-status', ticketController.getQueueStatus);

// STAFF ROUTES - Auth required
router.post('/next', 
    authMiddleware, 
    roleMiddleware('employee', 'admin', 'supervisor'),
    ticketController.getNextTicket
);

router.put('/serve',
    authMiddleware,
    roleMiddleware('employee', 'admin', 'supervisor'),
    ticketController.serveTicket
);

router.put('/complete',
    authMiddleware,
    roleMiddleware('employee', 'admin', 'supervisor'),
    ticketController.completeTicket
);

module.exports = router;