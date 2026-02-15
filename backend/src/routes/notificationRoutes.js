const express = require('express');
const router = express.Router();
const { Notification, Ticket } = require('../models');

// Middleware auth simple
const auth = (req, res, next) => {
  req.user = { id: null, role: 'admin' };
  next();
};

router.use(auth);

// POST /send
router.post('/send', async (req, res) => {
  try {
    const { ticketId, message, type } = req.body;
    
    const notification = await Notification.create({
  ticket_id: ticketId,
  // user_id: 1,  // ← COMMENTE CETTE LIGNE
  user_id: null,  // ← OU AJOUTE NULL
  message,
  type: type || 'info',
  status: 'sent',
  sent_at: new Date()
});
    res.status(201).json({
      success: true,
      message: 'Notification envoyée',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /history
router.get('/history', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: { notifications } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
