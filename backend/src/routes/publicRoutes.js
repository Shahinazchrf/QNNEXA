const express = require('express');
const router = express.Router();
const { Ticket, Service } = require('../models');
const { Op } = require('sequelize');

router.post('/ticket', async (req, res) => {
  try {
    const { serviceId } = req.body;

    const service = await Service.findByPk(serviceId);
    if (!service || !service.is_active) {
      return res.status(400).json({ error: 'Service non disponible' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastTicket = await Ticket.findOne({
      where: {
        service_id: service.id,
        createdAt: { [Op.gte]: today }
      },
      order: [['createdAt', 'DESC']]
    });

    let seqNumber = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const match = lastTicket.ticket_number.match(/\d+$/);
      if (match) seqNumber = parseInt(match[0]) + 1;
    }

    const ticketNumber = `${service.code}${seqNumber.toString().padStart(3, '0')}`;

    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      service_id: service.id,
      status: 'waiting',
      is_vip: false
    });

    res.status(201).json({
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        service: service.name,
        position: 1,
        estimatedTime: service.estimated_time || 10,
        isVIP: false,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

// GET /public/queue/:ticketId
router.get('/queue/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findByPk(ticketId, {
     include: [{ 
  model: Service, 
  as: 'service', 
  attributes: ['name', 'estimated_time'] 
}]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    const waitingAhead = await Ticket.count({
      where: {
        service_id: ticket.service_id,
        status: 'waiting',
        createdAt: { [Op.lt]: ticket.createdAt }
      }
    });

    res.json({
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        currentPosition: waitingAhead + 1,
       estimatedWaitTime: (waitingAhead + 1) * (ticket.service?.estimated_time || 10),
service: ticket.service?.name
      }
    });

  } catch (error) {
    console.error('❌ Erreur queue:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

module.exports = router;