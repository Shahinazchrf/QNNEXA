const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authMiddleware } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roles');

// Submit survey (public for clients, protected for others)
router.post('/submit', authMiddleware, surveyController.submitSurvey);

// View surveys (authenticated)
router.use(authMiddleware);

router.get('/', surveyController.getAllSurveys);
router.get('/stats', surveyController.getSurveyStats);
router.get('/:id', surveyController.getSurveyById);

module.exports = router;