const express = require('express');
const router = express.Router();
const { authMiddleware, requireEmployee } = require('../middlewares/auth');
const employeeController = require('../controllers/employeeController');

// All routes require employee authentication
router.use(authMiddleware);
router.use(requireEmployee);

// Employee dashboard
router.get('/dashboard', employeeController.getDashboard);

// Ticket operations
router.post('/call-next', employeeController.callNextTicket);
router.post('/start-serving', employeeController.startServing);
router.post('/complete', employeeController.completeService);

module.exports = router;