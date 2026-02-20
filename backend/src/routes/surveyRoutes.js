const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

// ==================== PUBLIC ROUTES (No authentication required) ====================

// Submit survey - Public
router.post('/submit', surveyController.submitSurvey);

// Get survey statistics - Public
router.get('/stats', surveyController.getSurveyStats);

// Get survey dashboard - Public
router.get('/dashboard', surveyController.getDashboard);

// Get survey by ticket ID - Public
router.get('/ticket/:ticketId', surveyController.getSurveyByTicket);

// ==================== AUTHENTICATED ROUTES ====================
// Ces routes nécessitent une authentification (admin only)

// Get all surveys (admin only) - Commenté car non défini dans le contrôleur
// router.get('/all', surveyController.getAllSurveys);

module.exports = router;