const express = require('express');
const router = express.Router();
const { Appointment, Ticket, Service } = require('../models');

router.post('/appointment/create', async (req, res) => {
  try {
    const { serviceId, scheduledTime } = req.body;
    
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    // Créer le rendez-vous
    const appointment = await Appointment.create({
      userId: 1,
      serviceId: serviceId,
      scheduledTime: scheduledTime,
      status: 'confirmed'
    });
    
    // Créer le ticket VIP
    const ticket = await Ticket.create({
      ticket_number: `VIP-${service.code}-${Date.now().toString().slice(-4)}`,
      service_id: serviceId,
      user_id: 1,
      is_vip: true,
      status: 'waiting',
      appointment_id: appointment.id
    });
    
    // Lier le ticket au rendez-vous
    await appointment.update({ ticketId: ticket.id });
    
    res.status(201).json({
      success: true,
      message: 'RDV VIP créé avec succès',
      data: {
        appointment: { id: appointment.id, scheduledTime },
        ticket: { id: ticket.id, ticketNumber: ticket.ticket_number }
      }
    });
    
  } catch (error) {
    console.error('❌ VIP Error:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

module.exports = router;