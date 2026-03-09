const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authMiddleware, requireAdmin } = require('../middlewares/auth');
const { Appointment, User, Service, Advisor } = require('../models');  // ← Ajoute Appointment ici

// Récupérer tous les rendez-vous (pour admin)
router.get('/appointments', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: User, as: 'client', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Service, as: 'service' },
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
      order: [['scheduled_time', 'ASC']]
    });
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirmer un rendez-vous
router.put('/appointments/:id/confirm', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { advisorId } = req.body;
    
    const appointment = await Appointment.findByPk(id, {
      include: [{ model: Advisor, as: 'advisor', include: [{ model: User, as: 'user' }] }]
    });
    
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Rendez-vous non trouvé' });
    }
    
    await appointment.update({
      advisor_id: advisorId,
      confirmation_status: 'confirmed',
      confirmed_at: new Date(),
      status: 'confirmed'
    });
    
    // Récupérer le conseiller pour le nom
    const advisor = await Advisor.findByPk(advisorId, {
      include: [{ model: User, as: 'user' }]
    });
    
    // CRÉER UNE NOTIFICATION
  // CRÉER LA NOTIFICATION (SANS ticket_id)
await Notification.create({
  user_id: appointment.user_id,
  type: 'info',
  message: `Votre rendez-vous du ${new Date(appointment.scheduled_time).toLocaleString()} a été confirmé avec ${advisor.user.first_name} ${advisor.user.last_name}`,
  // Pas de ticket_id ici
  createdAt: new Date(),
  updatedAt: new Date()
});
    res.json({ success: true, message: 'Rendez-vous confirmé' });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Annuler un rendez-vous
// Confirmer un rendez-vous
router.put('/appointments/:id/confirm', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { advisorId } = req.body;
    
    const appointment = await Appointment.findByPk(id, {
      include: [{ model: Advisor, as: 'advisor', include: [{ model: User, as: 'user' }] }]
    });
    
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Rendez-vous non trouvé' });
    }
    
    await appointment.update({
      advisor_id: advisorId,
      confirmation_status: 'confirmed',
      confirmed_at: new Date(),
      status: 'confirmed'
    });
    
    // Récupérer le conseiller pour le nom
    const advisor = await Advisor.findByPk(advisorId, {
      include: [{ model: User, as: 'user' }]
    });
    
    // CRÉER LA NOTIFICATION AVEC TRY/CATCH
    // CRÉER LA NOTIFICATION (SANS ticket_id)
// CRÉER LA NOTIFICATION (SANS ticket_id)
try {
  console.log('📝 Tentative création notification pour user:', appointment.user_id);
  console.log('📝 Message:', `Votre rendez-vous du ${new Date(appointment.scheduled_time).toLocaleString()} a été confirmé avec ${advisor.user.first_name} ${advisor.user.last_name}`);
  
  const notif = await Notification.create({
    user_id: appointment.user_id,
    type: 'info',
    message: `Votre rendez-vous du ${new Date(appointment.scheduled_time).toLocaleString()} a été confirmé avec ${advisor.user.first_name} ${advisor.user.last_name}`,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Notification créée avec ID:', notif.id);
} catch (err) {
  console.error('❌ ERREUR NOTIFICATION DÉTAILLÉE:', err);
}
    
    res.json({ success: true, message: 'Rendez-vous confirmé' });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;