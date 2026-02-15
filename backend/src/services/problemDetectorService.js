const { Ticket, Counter, Service } = require('../models');
const { Op } = require('sequelize');

class ProblemDetectorService {
  constructor() {
    this.config = {
      forgottenTicketThreshold: 30 * 60 * 1000, // 30 minutes
      idleCounterThreshold: 15 * 60 * 1000,     // 15 minutes
      vipWaitThreshold: 10 * 60 * 1000,        // 10 minutes
      checkInterval: 60 * 1000                  // Vérifier toutes les minutes
    };
  }

  async detectAllProblems() {
    const problems = [];

    // Détecter les tickets oubliés
    problems.push(...await this.detectForgottenTickets());
    
    // Détecter les guichets inactifs
    problems.push(...await this.detectIdleCounters());
    
    // Détecter les VIP attendant trop longtemps
    problems.push(...await this.detectVIPWaitingTooLong());
    
    // Détecter les guichets surchargés
    problems.push(...await this.detectOverloadedCounters());

    return this.organizeProblems(problems);
  }

  async detectForgottenTickets() {
    const threshold = new Date(Date.now() - this.config.forgottenTicketThreshold);
    
    const forgottenTickets = await Ticket.findAll({
      where: {
        status: 'waiting',
        isVIP: false,
        createdAt: { [Op.lt]: threshold }
      },
      include: [
        { model: Service, attributes: ['name'] },
        { model: Counter, attributes: ['number', 'name'] }
      ],
      limit: 20
    });

    return forgottenTickets.map(ticket => ({
      type: 'FORGOTTEN_TICKET',
      severity: 'normal',
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      service: ticket.Service?.name,
      counter: ticket.Counter ? `${ticket.Counter.number} - ${ticket.Counter.name}` : 'Non assigné',
      waitingSince: ticket.createdAt,
      waitTime: Math.floor((Date.now() - ticket.createdAt) / (60 * 1000)),
      message: `Ticket ${ticket.ticketNumber} (${ticket.Service?.name}) attend depuis ${Math.floor((Date.now() - ticket.createdAt) / (60 * 1000))} minutes`,
      suggestedAction: 'Vérifier si le client est présent ou prioriser le ticket'
    }));
  }

  async detectIdleCounters() {
    const threshold = new Date(Date.now() - this.config.idleCounterThreshold);
    
    const idleCounters = await Counter.findAll({
      where: {
        status: 'active',
        lastActivityAt: { [Op.lt]: threshold }
      },
      include: [{
        model: Service,
        attributes: ['name']
      }]
    });

    return idleCounters.map(counter => ({
      type: 'IDLE_COUNTER',
      severity: 'normal',
      counterId: counter.id,
      counterNumber: counter.number,
      service: counter.Service?.name,
      lastActivity: counter.lastActivityAt,
      idleTime: Math.floor((Date.now() - counter.lastActivityAt) / (60 * 1000)),
      message: `Guichet ${counter.number} (${counter.Service?.name}) inactif depuis ${Math.floor((Date.now() - counter.lastActivityAt) / (60 * 1000))} minutes`,
      suggestedAction: 'Vérifier l\'employé ou mettre en pause le guichet'
    }));
  }

  async detectVIPWaitingTooLong() {
    const threshold = new Date(Date.now() - this.config.vipWaitThreshold);
    
    const waitingVIPs = await Ticket.findAll({
      where: {
        status: 'waiting',
        isVIP: true,
        createdAt: { [Op.lt]: threshold }
      },
      include: [
        { model: Service, attributes: ['name'] },
        { model: Counter, attributes: ['number'] }
      ],
      limit: 10
    });

    return waitingVIPs.map(ticket => ({
      type: 'VIP_WAITING_TOO_LONG',
      severity: 'vip',
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      service: ticket.Service?.name,
      counter: ticket.Counter?.number || 'Non assigné',
      waitingSince: ticket.createdAt,
      waitTime: Math.floor((Date.now() - ticket.createdAt) / (60 * 1000)),
      message: `VIP ${ticket.ticketNumber} (${ticket.Service?.name}) attend depuis ${Math.floor((Date.now() - ticket.createdAt) / (60 * 1000))} minutes`,
      suggestedAction: 'Prioriser immédiatement ou réaffecter à un guichet libre'
    }));
  }

  async detectOverloadedCounters() {
    const counters = await Counter.findAll({
      where: { status: 'active' },
      include: [{
        model: Service,
        attributes: ['name']
      }]
    });

    const problems = [];

    for (const counter of counters) {
      const waitingCount = await Ticket.count({
        where: {
          counterId: counter.id,
          status: 'waiting'
        }
      });

      if (waitingCount > 15) {
        problems.push({
          type: 'OVERLOADED_COUNTER',
          severity: 'vip',
          counterId: counter.id,
          counterNumber: counter.number,
          service: counter.Service?.name,
          waitingCount,
          message: `Guichet ${counter.number} (${counter.Service?.name}) surchargé: ${waitingCount} tickets en attente`,
          suggestedAction: 'Réaffecter des tickets ou ouvrir un autre guichet'
        });
      }
    }

    return problems;
  }

  organizeProblems(problems) {
    // Trier par sévérité
    const severityOrder = { vip: normal, normal: normal, normal: normal };
    problems.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Grouper par type
    const byType = {};
    problems.forEach(problem => {
      if (!byType[problem.type]) {
        byType[problem.type] = [];
      }
      byType[problem.type].push(problem);
    });

    return {
      all: problems,
      byType,
      summary: {
        total: problems.length,
        vip: problems.filter(p => p.severity === 'vip').length,
        normal: problems.filter(p => p.severity === 'normal').length,
        normal: problems.filter(p => p.severity === 'normal').length,
        byType: Object.keys(byType).reduce((acc, type) => {
          acc[type] = byType[type].length;
          return acc;
        }, {})
      }
    };
  }

  // Scheduler pour vérifications automatiques
  startScheduler() {
    setInterval(async () => {
      try {
        const problems = await this.detectAllProblems();
        
        // Envoyer une alerte si problèmes critiques
        const criticalProblems = problems.all.filter(p => p.severity === 'vip');
        if (criticalProblems.length > 0) {
          await this.sendCriticalAlert(criticalProblems);
        }

        // Log pour monitoring
        console.log(`[ProblemDetector] Vérifié à ${new Date().toISOString()}: ${problems.summary.total} problèmes détectés`);
        
      } catch (error) {
        console.error('❌ Erreur détection problèmes automatique:', error);
      }
    }, this.config.checkInterval);
  }

  async sendCriticalAlert(problems) {
    // Envoyer une notification aux admins
    const message = `🚨 ALERTE: ${problems.length} problème(s) critique(s) détecté(s)`;
    
    await Notification.create({
      type: 'critical_alert',
      message,
      channel: 'in_app',
      priority: vip,
      metadata: {
        problemsCount: problems.length,
        problems: problems.map(p => ({
          type: p.type,
          message: p.message
        })),
        timestamp: new Date()
      }
    });

    // Optionnel: Envoyer un email aux admins
    if (process.env.ADMIN_EMAIL) {
      await sendAdminEmail({
        subject: `Alerte système - ${problems.length} problème(s) critique(s)`,
        problems
      });
    }
  }
}

module.exports = new ProblemDetectorService();