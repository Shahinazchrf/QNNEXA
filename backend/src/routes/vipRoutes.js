const express = require('express');
console.log('✅ vipRoutes.js chargé avec route /create');
const router = express.Router();
const { Appointment, Ticket, Service, Advisor, User } = require('../models');
const { authMiddleware } = require('../middlewares/auth');
const { Op } = require('sequelize');

// Obtenir la liste des conseillers
router.get('/advisors', async (req, res) => {
  try {
    const advisors = await Advisor.findAll({
      where: { is_available: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });
    
    res.json({ success: true, advisors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Créer un rendez-vous (demande)
router.post('/appointment/create', authMiddleware, async (req, res) => {
  try {
    const { serviceId, scheduledTime, notes } = req.body;
    const userId = req.user.id;
    
    // Vérifier le service
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    // Créer le rendez-vous avec statut 'pending'
    const appointment = await Appointment.create({
      user_id: userId,
      service_id: serviceId,
      scheduled_time: scheduledTime,
      notes,
      status: 'pending',
      confirmation_status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Demande de rendez-vous envoyée',
      appointment: {
        id: appointment.id,
        scheduled_time: appointment.scheduled_time,
        status: appointment.confirmation_status
      }
    });
    
  } catch (error) {
    console.error('❌ VIP Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer les rendez-vous du client
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name', 'code'] },
        { 
          model: Advisor, 
          as: 'advisor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }]
        }
      ],
      order: [['scheduled_time', 'DESC']]
    });
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;