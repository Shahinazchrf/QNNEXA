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

// Obtenir les créneaux disponibles
router.get('/available-slots', authMiddleware, async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    
    if (!date || !serviceId) {
      return res.status(400).json({ success: false, error: 'Date and serviceId required' });
    }
    
    // Récupérer les rendez-vous déjà pris pour cette date
    const bookedAppointments = await Appointment.findAll({
      where: {
        scheduled_time: {
          [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`]
        },
        service_id: serviceId
      }
    });
    
    // Extraire les heures des rendez-vous pris
    const bookedTimes = bookedAppointments.map(apt => {
      const time = new Date(apt.scheduled_time);
      return `${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}`;
    });
    
    res.json({ 
      success: true, 
      bookedSlots: bookedTimes 
    });
    
  } catch (error) {
    console.error('❌ Error loading slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Créer un rendez-vous (demande)
router.post('/appointment/create', authMiddleware, async (req, res) => {
  console.log('='.repeat(50));
  console.log('🔍 NOUVELLE DEMANDE DE RENDEZ-VOUS');
  console.log('📥 Données reçues:', JSON.stringify(req.body, null, 2));
  console.log('👤 Utilisateur:', req.user?.id, req.user?.email);
  console.log('='.repeat(50));
  
  try {
    const { serviceId, scheduledTime, notes } = req.body;
    const userId = req.user.id;
    
    console.log('📌 serviceId:', serviceId);
    console.log('📌 scheduledTime:', scheduledTime);
    console.log('📌 notes:', notes);
    
    // Vérifier le service
    const service = await Service.findByPk(serviceId);
    if (!service) {
      console.log('❌ Service non trouvé:', serviceId);
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    console.log('✅ Service trouvé:', service.name);
    
    // CRÉER UN RENDEZ-VOUS, PAS UN TICKET !
    console.log('📝 Création du rendez-vous...');
    const appointment = await Appointment.create({
      user_id: userId,
      service_id: serviceId,
      scheduled_time: scheduledTime,
      notes,
      status: 'pending',
      confirmation_status: 'pending'
    });
    
    console.log('✅ Rendez-vous créé avec ID:', appointment.id);
    console.log('='.repeat(50));
    
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
    console.error('❌ ERREUR VIP:', error);
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