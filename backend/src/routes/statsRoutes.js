const express = require('express');
const router = express.Router();
const { authMiddleware, requireEmployee } = require('../middlewares/auth');
const statsController = require('../controllers/statsController');

// All routes require authentication
router.use(authMiddleware);
router.use(requireEmployee);

// Statistics routes
router.get('/daily', statsController.getDailyStats);
router.get('/realtime', statsController.getRealTimeStats);
router.get('/period', statsController.getPeriodStats);

module.exports = router;