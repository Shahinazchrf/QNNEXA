// backend/src/routes/superAdminRoutes.js

const express = require('express');
const router = express.Router();
const { authMiddleware, requireSuperAdmin } = require('../middlewares/auth');
const superAdminController = require('../controllers/superAdminController');

// Toutes les routes nécessitent une authentification super admin
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Dashboard
router.get('/dashboard', superAdminController.getDashboard);

// Statistiques globales
router.get('/stats', superAdminController.getGlobalStats);

// Gestion des agences
router.get('/agencies', superAdminController.getAgencies);
router.post('/agencies', superAdminController.createAgency);
router.put('/agencies/:id', superAdminController.updateAgency);
router.delete('/agencies/:id', superAdminController.deleteAgency);

// Gestion des services
router.get('/services', superAdminController.getServices);
router.post('/services', superAdminController.createService);
router.put('/services/:id', superAdminController.updateService);
router.delete('/services/:id', superAdminController.deleteService);

// Gestion des compteurs
router.get('/counters', superAdminController.getCounters);
router.post('/counters', superAdminController.createCounter);
router.put('/counters/:id', superAdminController.updateCounter);
router.delete('/counters/:id', superAdminController.deleteCounter);

// Gestion des utilisateurs
router.get('/users', superAdminController.getUsers);
router.post('/users', superAdminController.createUser);
router.put('/users/:id', superAdminController.updateUser);
router.delete('/users/:id', superAdminController.deleteUser);
router.post('/users/:id/reset-password', superAdminController.resetPassword);

// Rapports
router.post('/reports', superAdminController.generateReport);

module.exports = router;