const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Public routes
router.get('/status', queueController.getQueueStatus);

module.exports = router;