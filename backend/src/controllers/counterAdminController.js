const { Ticket, Counter, Service } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    res.json({
      success: true,
      data: {
        stats: {
          today: await Ticket.count({ where: { createdAt: { [Op.gte]: today } } }),
          waiting: await Ticket.count({ where: { status: 'waiting' } }),
          counters: await Counter.count({ where: { status: 'active' } })
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.prioritizeTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const { sequelize } = require('../config/database');
    
    // SQL direct pour être sûr
    await sequelize.query(
      "UPDATE tickets SET priority = 'vip' WHERE id = ?",
      { replacements: [ticketId] }
    );
    
    res.json({ success: true, message: 'Ticket priorisé' });
  } catch (error) {
    console.error('ERREUR:', error);
    res.status(500).json({ error: error.message });
  }
};