
// services/ticketMonitorService.js
const { Ticket, Counter, Op } = require('../models');

class TicketMonitorService {
  async markMissedTickets() {
    try {
      const timeoutMinutes = 5; // 5 minutes
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const cutoffTime = new Date(Date.now() - timeoutMs);
      
      // Find tickets called >5 minutes ago
      const missedTickets = await Ticket.findAll({
        where: {
          status: 'called',
          called_at: { [Op.lt]: cutoffTime }
        },
        include: [{ model: Counter, as: 'counter' }]
      });
      
      let results = [];
      for (const ticket of missedTickets) {
        await ticket.update({
          status: 'missed',
          missed_at: new Date()
        });
        
        // Release counter
        if (ticket.counter) {
          await ticket.counter.update({
            status: 'active',
            current_ticket_id: null
          });
        }
        
        results.push({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          called_at: ticket.called_at,
          marked_missed_at: new Date()
        });
      }
      
      return { success: true, count: results.length, tickets: results };
    } catch (error) {
      console.error('Error marking missed tickets:', error);
      return { success: false, error: error.message };
    }
  }
  
  async runAllTasks() {
    const missedResult = await this.markMissedTickets();
    return {
      missed_tickets: missedResult,
      no_show_appointments: { count: 0 },
      reassigned_tickets: { count: 0 }
    };
  }
}

module.exports = new TicketMonitorService();