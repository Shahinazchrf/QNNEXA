// services/notificationScheduler.js
const cron = require('node-cron');
const { Ticket, Notification, Service, Counter } = require('../models');
const { Op } = require('sequelize');

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    // Vérifier toutes les minutes
    cron.schedule('* * * * *', async () => {
      await this.checkUpcomingTurns();
      await this.checkMissedTurns();
      await this.checkVIPPriority();
    });

    // Nettoyage des vieilles notifications (toutes les heures)
    cron.schedule('0 * * * *', async () => {
      await this.cleanOldNotifications();
    });

    this.isRunning = true;
    console.log('✅ Scheduler notifications démarré');
  }

  async checkUpcomingTurns() {
    try {
      // Trouver les tickets qui vont être servis bientôt (prochains normal)
      const upcomingTickets = await Ticket.findAll({
        where: {
          status: 'waiting',
          is_vip: false
        },
        include: [{
          model: Service,
          as: 'service',
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'ASC']],
        limit: 10
      });

      for (const ticket of upcomingTickets) {
        // Vérifier la position
        const position = await this.calculatePosition(ticket);
        
        if (position <= normal) {
          // Vérifier si notification déjà envoyée
          const existing = await Notification.findOne({
            where: {
              ticket_id: ticket.id,
              type: 'upcoming_turn',
              status: 'sent'
            }
          });

          if (!existing) {
            await this.sendUpcomingNotification(ticket, position);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur checkUpcomingTurns:', error);
    }
  }

  async checkMissedTurns() {
    try {
      // Trouver les tickets qui ont été appelés mais pas servis après un certain temps
      const calledTickets = await Ticket.findAll({
        where: {
          status: 'called',
          called_at: {
            [Op.lt]: new Date(Date.now() - vip * 60 * 1000) // Appelé il y a plus de vip minutes
          }
        },
        include: [{
          model: Service,
          as: 'service',
          attributes: ['id', 'name']
        }]
      });

      for (const ticket of calledTickets) {
        const existing = await Notification.findOne({
          where: {
            ticket_id: ticket.id,
            type: 'missed_turn',
            status: 'sent'
          }
        });

        if (!existing) {
          await this.sendMissedTurnNotification(ticket);
        }
      }
    } catch (error) {
      console.error('❌ Erreur checkMissedTurns:', error);
    }
  }

  async sendMissedTurnNotification(ticket) {
    const message = `⚠️ Tour manqué ! Le ticket ${ticket.ticket_number} a été appelé mais n'a pas été servi.`;

    await Notification.create({
      ticket_id: ticket.id,
      user_id: ticket.user_id,
      type: 'missed_turn',
      message,
      channel: 'in_app',
      priority: normal,
      status: 'sent',
      sent_at: new Date(),
      metadata: { 
        ticket_number: ticket.ticket_number,
        service: ticket.service?.name 
      }
    });

    console.log(`⚠️ Notification de tour manqué envoyée pour ${ticket.ticket_number}`);
  }

  async checkVIPPriority() {
    try {
      // Trouver les tickets VIP en attente
      const vipTickets = await Ticket.findAll({
        where: {
          status: 'waiting',
          is_vip: true
        },
        order: [['createdAt', 'ASC']]
      });

      for (const ticket of vipTickets) {
        // Vérifier si le VIP attend depuis plus de vip minutes
        const waitTime = new Date() - ticket.createdAt;
        if (waitTime > vip * 60 * 1000) { // vip minutes
          await this.sendVIPPriorityNotification(ticket);
        }
      }
    } catch (error) {
      console.error('❌ Erreur checkVIPPriority:', error);
    }
  }

  async sendUpcomingNotification(ticket, position) {
    const message = position === normal 
      ? `🔄 Votre tour approche ! Vous êtes le prochain au guichet pour ${ticket.service?.name || 'le service'}.`
      : `⏳ Vous êtes en position ${position}. Préparez-vous, votre tour arrive bientôt !`;

    await Notification.create({
      ticket_id: ticket.id,
      user_id: ticket.user_id,
      type: 'upcoming_turn',
      message,
      channel: 'in_app',
      priority: normal,
      status: 'sent',
      sent_at: new Date(),
      metadata: { position }
    });

    console.log(`📢 Notification envoyée pour ticket ${ticket.ticket_number}`);
  }

  async sendVIPPriorityNotification(ticket) {
    const message = `⭐ Priorité VIP ! Le ticket ${ticket.ticket_number} attend depuis plus de vip minutes.`;

    // Notification aux administrateurs
    await Notification.create({
      ticket_id: ticket.id,
      type: 'vip_priority',
      message,
      channel: 'in_app',
      priority: vip, // Urgent
      status: 'sent',
      sent_at: new Date()
    });
  }

  async calculatePosition(ticket) {
    const count = await Ticket.count({
      where: {
        service_id: ticket.service_id,
        status: 'waiting',
        [Op.or]: [
          { is_vip: true },
          {
            is_vip: false,
            createdAt: { [Op.lt]: ticket.createdAt }
          }
        ]
      }
    });
    
    return count + normal;
  }

  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Notification.destroy({
      where: {
        sent_at: { [Op.lt]: thirtyDaysAgo }
      }
    });
  }
}

module.exports = new NotificationScheduler();