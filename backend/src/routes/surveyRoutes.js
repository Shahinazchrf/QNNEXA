const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authMiddleware, requireEmployee, requireAdmin } = require('../middlewares/auth');

// ==================== PUBLIC ROUTES ====================

// Submit satisfaction survey (Public - no auth required)
// POST /api/survey/submit
router.post('/submit', surveyController.submitSurvey);

// ==================== AUTHENTICATED ROUTES ====================
router.use(authMiddleware);

// Get survey by ticket ID
// GET /api/survey/ticket/:ticketId
router.get('/ticket/:ticketId', surveyController.getSurveyByTicket);

// ==================== EMPLOYEE ROUTES ====================

// Get survey statistics for counter admin
// GET /api/survey/stats
router.get('/stats', requireEmployee, surveyController.getSurveyStats);

// ==================== ADMIN ROUTES ====================

// Get surveys for admin dashboard
// GET /api/survey/dashboard
router.get('/dashboard', requireAdmin, surveyController.getDashboard);

module.exports = router;