// Module de détection de problèmes - QONNEXEA
// Basé sur des règles simples pour optimiser la file d'attente

class ProblemDetector {
  constructor() {
    // Seuils configurables (en minutes)
    this.thresholds = {
      forgottenTicket: 25,     // Ticket oublié après 25 min
      idleCounter: 15,         // Guichet inactif après 15 min
      vipWait: 10,             // VIP attend trop longtemps (10 min)
      overloadPerCounter: 12,  // Surcharge si +12 tickets par guichet
      satisfactionAlert: 2.5,  // Alerte si satisfaction < 2.5/5
      peakHourStart: 10,       // Heure de début des pics
      peakHourEnd: 12          // Heure de fin des pics
    };
  }

  // Méthode principale d'analyse
  analyze(tickets, counters, satisfaction, currentTime) {
    const problems = [];
    const recommendations = [];

    // 1. Détection des tickets oubliés
    this.detectForgottenTickets(tickets, problems);
    
    // 2. Détection des guichets inactifs
    this.detectIdleCounters(counters, problems);
    
    // 3. Détection des VIP en attente
    this.detectVipWaiting(tickets, problems);
    
    // 4. Détection de surcharge
    this.detectOverload(tickets, counters, problems);
    
    // 5. Analyse satisfaction
    this.analyzeSatisfaction(satisfaction, problems);
    
    // 6. Recommandations d'optimisation
    this.generateRecommendations(tickets, counters, satisfaction, recommendations);

    return {
      problems,
      recommendations,
      summary: this.generateSummary(problems, recommendations)
    };
  }

  // 1. Tickets oubliés
  detectForgottenTickets(tickets, problems) {
    const now = new Date();
    
    tickets.forEach(ticket => {
      if (ticket.status === 'waiting') {
        const createdAt = new Date(ticket.createdAt || ticket.date);
        const waitTime = Math.round((now - createdAt) / (1000 * 60));
        
        if (waitTime > this.thresholds.forgottenTicket) {
          problems.push({
            id: `forgotten_${ticket.id}`,
            type: 'FORGOTTEN_TICKET',
            severity: 'high',
            title: 'Ticket oublié',
            message: `Ticket ${ticket.number || ticket.id} attend depuis ${waitTime} minutes`,
            impact: 'Client risque de partir ou d\'être mécontent',
            action: 'Prioriser ce ticket ou contacter le client',
            ticketId: ticket.id,
            waitTime,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  // 2. Guichets inactifs
  detectIdleCounters(counters, problems) {
    const now = new Date();
    
    counters.forEach(counter => {
      if (counter.status === 'active') {
        const lastActivity = counter.lastActivityAt ? new Date(counter.lastActivityAt) : now;
        const idleTime = Math.round((now - lastActivity) / (1000 * 60));
        
        if (idleTime > this.thresholds.idleCounter && idleTime < 60) {
          problems.push({
            id: `idle_${counter.id}`,
            type: 'IDLE_COUNTER',
            severity: 'medium',
            title: 'Guichet inactif',
            message: `Guichet ${counter.number || counter.id} inactif depuis ${idleTime} minutes`,
            impact: 'Perte de productivité, file d\'attente augmente',
            action: 'Vérifier l\'employé ou réaffecter des tickets',
            counterId: counter.id,
            idleTime,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  // 3. VIP en attente
  detectVipWaiting(tickets, problems) {
    const now = new Date();
    
    tickets.forEach(ticket => {
      if (ticket.status === 'waiting' && ticket.isVIP) {
        const createdAt = new Date(ticket.createdAt || ticket.date);
        const waitTime = Math.round((now - createdAt) / (1000 * 60));
        
        if (waitTime > this.thresholds.vipWait) {
          problems.push({
            id: `vip_${ticket.id}`,
            type: 'VIP_WAITING',
            severity: 'high',
            title: 'VIP en attente',
            message: `Client VIP ${ticket.number || ticket.id} attend depuis ${waitTime} minutes`,
            impact: 'Risque de perdre un client important',
            action: 'Prioriser immédiatement ce ticket',
            ticketId: ticket.id,
            waitTime,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  // 4. Détection de surcharge
  detectOverload(tickets, counters, problems) {
    const activeCounters = counters.filter(c => c.status === 'active').length;
    const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
    
    if (activeCounters > 0) {
      const ticketsPerCounter = waitingTickets / activeCounters;
      
      if (ticketsPerCounter > this.thresholds.overloadPerCounter) {
        problems.push({
          id: 'overload',
          type: 'OVERLOAD',
          severity: 'high',
          title: 'Surcharge détectée',
          message: `${waitingTickets} tickets en attente pour ${activeCounters} guichets actifs`,
          impact: 'Temps d\'attente va augmenter considérablement',
          action: 'Ouvrir un guichet supplémentaire',
          stats: {
            waitingTickets,
            activeCounters,
            ticketsPerCounter: Math.round(ticketsPerCounter * 10) / 10
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // 5. Analyse satisfaction
  analyzeSatisfaction(satisfaction, problems) {
    if (!satisfaction || !satisfaction.average) return;
    
    if (satisfaction.average < this.thresholds.satisfactionAlert) {
      problems.push({
        id: 'low_satisfaction',
        type: 'LOW_SATISFACTION',
        severity: 'high',
        title: 'Satisfaction client en baisse',
        message: `Note moyenne de satisfaction: ${satisfaction.average}/5`,
        impact: 'Les clients sont mécontents du service',
        action: 'Analyser les commentaires et améliorer la qualité',
        stats: satisfaction,
        timestamp: new Date().toISOString()
      });
    }
    
    // Corrélation temps d'attente / satisfaction
    if (satisfaction.correlations && satisfaction.correlations.waitTime > 0.7) {
      problems.push({
        id: 'wait_correlation',
        type: 'STRONG_CORRELATION',
        severity: 'medium',
        title: 'Fort lien attente-satisfaction',
        message: 'Le temps d\'attente impacte fortement la satisfaction',
        impact: 'Réduire les temps d\'attente améliorera la satisfaction',
        action: 'Optimiser la gestion des files',
        correlation: satisfaction.correlations.waitTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 6. Recommandations d'optimisation
  generateRecommendations(tickets, counters, satisfaction, recommendations) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Recommandation pour heure de pointe
    if (currentHour >= this.thresholds.peakHourStart && currentHour <= this.thresholds.peakHourEnd) {
      const waitingCount = tickets.filter(t => t.status === 'waiting').length;
      const activeCounters = counters.filter(c => c.status === 'active').length;
      
      if (waitingCount > activeCounters * 8) {
        recommendations.push({
          id: 'peak_hour',
          type: 'PEAK_HOUR',
          title: 'Heure de pointe détectée',
          recommendation: 'Ouvrir 1 ou 2 guichets supplémentaires',
          expectedGain: 'Réduction de 30% du temps d\'attente',
          priority: 'high'
        });
      }
    }
    
    // Recommandation basée sur satisfaction
    if (satisfaction && satisfaction.average < 3.5) {
      recommendations.push({
        id: 'improve_service',
        type: 'SERVICE_QUALITY',
        title: 'Amélioration service client',
        recommendation: 'Former les employés sur les services les moins bien notés',
        expectedGain: 'Augmentation de 15% de la satisfaction',
        priority: 'medium'
      });
    }
    
    // Recommandation équilibrage charge
    const waitingByService = {};
    tickets.filter(t => t.status === 'waiting').forEach(t => {
      waitingByService[t.service] = (waitingByService[t.service] || 0) + 1;
    });
    
    Object.entries(waitingByService).forEach(([service, count]) => {
      if (count > 10) {
        recommendations.push({
          id: `service_${service}`,
          type: 'SERVICE_OVERLOAD',
          title: `Surcharge service ${service}`,
          recommendation: `Affecter un guichet dédié au service ${service}`,
          expectedGain: 'Fluidification du flux',
          priority: 'medium'
        });
      }
    });
  }

  // Générer un résumé
  generateSummary(problems, recommendations) {
    return {
      totalProblems: problems.length,
      bySeverity: {
        high: problems.filter(p => p.severity === 'high').length,
        medium: problems.filter(p => p.severity === 'medium').length,
        low: problems.filter(p => p.severity === 'low').length
      },
      byType: problems.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      topPriority: problems.filter(p => p.severity === 'high').slice(0, 3),
      recommendations: recommendations.length,
      timestamp: new Date().toISOString()
    };
  }

  // Mettre à jour les seuils
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

export default new ProblemDetector();
