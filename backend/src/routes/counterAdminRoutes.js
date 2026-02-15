const express = require('express');
const router = express.Router();
const { Ticket, Counter } = require('../models');

// Middleware test
router.use((req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
});

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const { Op } = require('sequelize');
    
    res.json({
      success: true,
      data: {
        stats: {
          today: await Ticket.count({ where: { createdAt: { [Op.gte]: today } } }),
          waiting: await Ticket.count({ where: { status: 'waiting' } }),
          activeCounters: await Counter.count({ where: { status: 'active' } })
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Problèmes
router.get('/problems', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const thirtyMin = new Date(Date.now() - 30*60000);
    const forgotten = await Ticket.count({ 
      where: { status: 'waiting', createdAt: { [Op.lt]: thirtyMin } } 
    });
    
    res.json({
      success: true,
      data: { problems: forgotten, total: forgotten }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOUVELLE ROUTE - Prioriser
router.post('/queue/prioritize', async (req, res) => {
  try {
    const { ticketId } = req.body;
    await Ticket.update({ priority: 'vip' }, { where: { id: ticketId } });
    res.json({ success: true, message: 'Ticket priorisé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOUVELLE ROUTE - Réaffecter
router.post('/queue/reassign', async (req, res) => {
  try {
    const { ticketId, newCounterId } = req.body;
    await Ticket.update({ counterId: newCounterId }, { where: { id: ticketId } });
    res.json({ success: true, message: 'Ticket réaffecté' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NOUVELLE ROUTE - Toggle guichet
router.post('/counter/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const status = action === 'open' ? 'active' : 'closed';
    
    await Counter.update({ status }, { where: { id } });
    res.json({ success: true, message: `Guichet ${action}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
