const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/roles');

// All routes require authentication
router.use(authMiddleware);

// User notifications
router.get('/my', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.get('/stats', notificationController.getNotificationStats);

// Admin only routes
router.post('/', requireAdmin, notificationController.createNotification);

module.exports = router;