const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// Admin dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Service management
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);

// Counter management
router.get('/counters', adminController.getCounters);
router.post('/counters/assign', adminController.assignEmployeeToCounter);

module.exports = router;