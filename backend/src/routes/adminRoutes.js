const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// Toutes les routes nécessitent une authentification admin
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// ===== GESTION DES SERVICES =====
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// ===== GESTION DES COMPTEURS =====
router.get('/counters', adminController.getCounters);
router.post('/counters', adminController.createCounter);
router.put('/counters/:id', adminController.updateCounter);
router.delete('/counters/:id', adminController.deleteCounter);

// ===== GESTION DES AGENCES =====
router.get('/agencies', adminController.getAgencies);
router.post('/agencies', adminController.createAgency);
router.put('/agencies/:id', adminController.updateAgency);
router.delete('/agencies/:id', adminController.deleteAgency);

// ===== GESTION DES UTILISATEURS =====
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetPassword);

// ===== RAPPORTS =====
router.post('/reports', adminController.generateReport);

module.exports = router;