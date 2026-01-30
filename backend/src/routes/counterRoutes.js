const express = require('express');
const router = express.Router();
const counterController = require('../controllers/counterController');
const { authMiddleware } = require('../middlewares/auth');
const { requireAdmin, requireEmployee } = require('../middlewares/roles');
const { counterValidation, validate } = require('../middlewares/validation');

// Public routes
router.get('/', counterController.getAllCounters);
router.get('/:id', counterController.getCounterById);

// Protected routes (require authentication)
router.use(authMiddleware);

// Employee routes
router.get('/:id/stats', requireEmployee, counterController.getCounterStats);

// Admin routes
router.post('/', 
  requireAdmin, 
  counterValidation.create, 
  validate, 
  counterController.createCounter
);

router.put('/:id', 
  requireAdmin, 
  counterValidation.update, 
  validate, 
  counterController.updateCounter
);

router.post('/assign', 
  requireAdmin, 
  counterController.assignEmployee
);

router.delete('/:id', 
  requireAdmin, 
  counterController.deleteCounter
);

module.exports = router;