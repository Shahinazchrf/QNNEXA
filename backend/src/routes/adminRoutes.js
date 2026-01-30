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
// Counter management
router.post('/counters', adminController.createCounter);
router.put('/counters/:id', adminController.updateCounter);
router.delete('/counters/:id', adminController.deleteCounter);
router.post('/counters/unassign', adminController.unassignEmployeeFromCounter);
router.post('/counters/status', adminController.changeCounterStatus);
router.get('/counters/:id/stats', adminController.getCounterStats);
module.exports = router;
