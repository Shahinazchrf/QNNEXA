const { Ticket, Service, Counter, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class StatsService {
  // Get daily statistics
  async getDailyStats(date = new Date()) {
    date.setHours(0, 0, 0, 0);
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTickets,
      completedTickets,
      avgWaitTime,
      serviceDistribution,
      hourlyStats
    ] = await Promise.all([
      Ticket.count({ where: { createdAt: { [Op.between]: [date, tomorrow] } } }),
      Ticket.count({ where: { status: 'completed', createdAt: { [Op.between]: [date, tomorrow] } } }),
      this.calculateAverageWaitTime(date, tomorrow),
      this.getServiceDistribution(date, tomorrow),
      this.getHourlyStats(date, tomorrow)
    ]);

    return {
      date: date.toISOString().split('T')[0],
      total_tickets: totalTickets,
      completed_tickets: completedTickets,
      completion_rate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : 0,
      avg_wait_time: avgWaitTime,
      service_distribution: serviceDistribution,
      hourly_stats: hourlyStats
    };
  }

  // Get real-time statistics
  async getRealTimeStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      waitingTickets,
      servingTickets,
      countersStatus,
      recentTickets,
      hourlyRate
    ] = await Promise.all([
      Ticket.count({ where: { status: 'waiting' } }),
      Ticket.count({ where: { status: 'serving' } }),
      this.getCountersStatus(),
      this.getRecentTickets(10),
      Ticket.count({ where: { createdAt: { [Op.gte]: oneHourAgo } } })
    ]);

    const avgWait = await this.calculateCurrentAvgWait();

    return {
      timestamp: now,
      queue_status: {
        waiting: waitingTickets,
        serving: servingTickets,
        total_active: waitingTickets + servingTickets,
        avg_wait_time: avgWait
      },
      counters: countersStatus,
      recent_activity: recentTickets,
      hourly_rate: hourlyRate,
      peak_hour: await this.getPeakHour()
    };
  }

  // Get period statistics (week, month, custom)
  async getPeriodStats(startDate, endDate) {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const [
      tickets,
      serviceStats,
      counterStats,
      dailyTrends
    ] = await Promise.all([
      Ticket.findAll({
        where: { createdAt: { [Op.between]: [startDate, adjustedEndDate] } },
        include: [
          { model: Service, as: 'ticketService' },
          { model: Counter, as: 'ticketCounter' }
        ]
      }),
      this.getServiceStats(startDate, adjustedEndDate),
      this.getCounterStats(startDate, adjustedEndDate),
      this.getDailyTrends(startDate, adjustedEndDate)
    ]);

    const completedTickets = tickets.filter(t => t.status === 'completed');
    const cancelledTickets = tickets.filter(t => t.status === 'cancelled');

    return {
      period: { start: startDate, end: endDate },
      overview: {
        total_tickets: tickets.length,
        completed_tickets: completedTickets.length,
        cancelled_tickets: cancelledTickets.length,
        completion_rate: tickets.length > 0 ? 
          ((completedTickets.length / tickets.length) * 100).toFixed(1) : 0,
        avg_service_time: this.calculateAverageServiceTime(completedTickets)
      },
      service_analysis: serviceStats,
      counter_performance: counterStats,
      daily_trends: dailyTrends,
      recommendations: this.generateRecommendations(tickets, serviceStats, counterStats)
    };
  }

  // Get employee performance
  async getEmployeePerformance(employeeId, period = 'month') {
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    const counter = await Counter.findOne({ where: { employee_id: employeeId } });
    if (!counter) return null;

    const tickets = await Ticket.findAll({
      where: {
        counter_id: counter.id,
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: Service, as: 'ticketService' }]
    });

    if (tickets.length === 0) {
      return {
        employee_id: employeeId,
        counter_id: counter.id,
        period: period,
        no_data: true
      };
    }

    const serviceTimes = tickets.map(t => t.actual_service_time || 0);
    const avgServiceTime = serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length;
    const minServiceTime = Math.min(...serviceTimes);
    const maxServiceTime = Math.max(...serviceTimes);

    // Group by service
    const serviceBreakdown = {};
    tickets.forEach(ticket => {
      const serviceName = ticket.ticketService?.name || 'Unknown';
      if (!serviceBreakdown[serviceName]) {
        serviceBreakdown[serviceName] = { count: 0, total_time: 0 };
      }
      serviceBreakdown[serviceName].count++;
      serviceBreakdown[serviceName].total_time += ticket.actual_service_time || 0;
    });

    return {
      employee_id: employeeId,
      counter_id: counter.id,
      period: period,
      total_tickets_served: tickets.length,
      avg_service_time: avgServiceTime.toFixed(1),
      min_service_time: minServiceTime,
      max_service_time: maxServiceTime,
      efficiency_score: this.calculateEfficiencyScore(avgServiceTime, tickets.length),
      service_breakdown: Object.entries(serviceBreakdown).map(([service, stats]) => ({
        service,
        count: stats.count,
        avg_time: (stats.total_time / stats.count).toFixed(1)
      })),
      daily_average: (tickets.length / ((endDate - startDate) / (1000 * 60 * 60 * 24))).toFixed(1)
    };
  }

  // Helper methods
  async calculateAverageWaitTime(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: {
        status: 'completed',
        called_at: { [Op.not]: null },
        completed_at: { [Op.between]: [startDate, endDate] }
      }
    });

    if (tickets.length === 0) return '0';

    const totalWait = tickets.reduce((sum, ticket) => {
      const waitTime = ticket.called_at ? 
        (new Date(ticket.called_at) - new Date(ticket.createdAt)) / 60000 : 0;
      return sum + waitTime;
    }, 0);

    return (totalWait / tickets.length).toFixed(1);
  }

  async calculateCurrentAvgWait() {
    const waitingTickets = await Ticket.findAll({
      where: { status: 'waiting' }
    });

    if (waitingTickets.length === 0) return '0';

    const now = new Date();
    const totalWait = waitingTickets.reduce((sum, ticket) => {
      return sum + ((now - ticket.createdAt) / 60000);
    }, 0);

    return (totalWait / waitingTickets.length).toFixed(1);
  }

  async getServiceDistribution(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Service, as: 'ticketService' }]
    });

    const serviceMap = {};
    tickets.forEach(ticket => {
      const serviceName = ticket.ticketService?.name || 'Unknown';
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = 0;
      }
      serviceMap[serviceName]++;
    });

    const total = tickets.length;

    return Object.entries(serviceMap).map(([service, count]) => ({
      service,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%'
    }));
  }

  async getHourlyStats(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } }
    });

    const hourlyCount = {};
    for (let i = 0; i < 24; i++) {
      hourlyCount[i] = 0;
    }

    tickets.forEach(ticket => {
      const hour = ticket.createdAt.getHours();
      hourlyCount[hour]++;
    });

    return Object.entries(hourlyCount).map(([hour, count]) => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      tickets: count
    }));
  }

  async getCountersStatus() {
    const counters = await Counter.findAll({
      where: { is_active: true },
      include: [
        {
          model: User,
          as: 'counterEmployee',
          attributes: ['first_name', 'last_name']
        },
        {
          model: Ticket,
          as: 'currentTicket',
          include: [{ model: Service, as: 'ticketService' }]
        }
      ]
    });

    return counters.map(counter => ({
      id: counter.id,
      number: counter.number,
      status: counter.status,
      employee: counter.counterEmployee ? 
        `${counter.counterEmployee.first_name} ${counter.counterEmployee.last_name}` : 
        'Unassigned',
      current_ticket: counter.currentTicket ? {
        number: counter.currentTicket.ticket_number,
        service: counter.currentTicket.ticketService?.name,
        start_time: counter.currentTicket.serving_started_at
      } : null,
      efficiency: this.calculateCounterEfficiency(counter)
    }));
  }

  async getRecentTickets(limit = 10) {
    const tickets = await Ticket.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        { model: Service, as: 'ticketService' },
        { model: Counter, as: 'ticketCounter' }
      ]
    });

    return tickets.map(ticket => ({
      id: ticket.id,
      number: ticket.ticket_number,
      service: ticket.ticketService?.name,
      status: ticket.status,
      counter: ticket.ticketCounter?.number || 'N/A',
      created_at: ticket.createdAt
    }));
  }

  async getPeakHour() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [today, tomorrow] } }
    });

    const hourlyCount = {};
    for (let i = 0; i < 24; i++) {
      hourlyCount[i] = 0;
    }

    tickets.forEach(ticket => {
      const hour = ticket.createdAt.getHours();
      hourlyCount[hour]++;
    });

    let peakHour = null;
    let maxCount = 0;

    for (let hour = 0; hour < 24; hour++) {
      if (hourlyCount[hour] > maxCount) {
        maxCount = hourlyCount[hour];
        peakHour = hour;
      }
    }

    return peakHour !== null ? {
      hour: peakHour.toString().padStart(2, '0') + ':00',
      tickets: maxCount
    } : null;
  }

  async getServiceStats(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: {
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: Service, as: 'ticketService' }]
    });

    const serviceMap = {};
    tickets.forEach(ticket => {
      const serviceName = ticket.ticketService?.name || 'Unknown';
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { count: 0, totalTime: 0 };
      }
      serviceMap[serviceName].count++;
      serviceMap[serviceName].totalTime += ticket.actual_service_time || 0;
    });

    return Object.entries(serviceMap).map(([service, data]) => ({
      service,
      ticket_count: data.count,
      avg_service_time: data.count > 0 ? (data.totalTime / data.count).toFixed(1) : 'N/A'
    }));
  }

  async getCounterStats(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: {
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: Counter, as: 'ticketCounter' }]
    });

    const counterMap = {};
    tickets.forEach(ticket => {
      const counterId = ticket.counter_id;
      if (!counterId) return;
      
      if (!counterMap[counterId]) {
        counterMap[counterId] = { count: 0, totalTime: 0 };
      }
      counterMap[counterId].count++;
      counterMap[counterId].totalTime += ticket.actual_service_time || 0;
    });

    return Object.entries(counterMap).map(([counterId, data]) => ({
      counter_id: counterId,
      tickets_served: data.count,
      avg_service_time: data.count > 0 ? (data.totalTime / data.count).toFixed(1) : 'N/A'
    }));
  }

  async getDailyTrends(startDate, endDate) {
    const tickets = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } }
    });

    const dailyMap = {};
    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { total: 0, completed: 0 };
      }
      dailyMap[date].total++;
      if (ticket.status === 'completed') {
        dailyMap[date].completed++;
      }
    });

    return Object.entries(dailyMap).map(([date, data]) => ({
      date,
      total_tickets: data.total,
      completed_tickets: data.completed,
      completion_rate: data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0
    }));
  }

  calculateAverageServiceTime(completedTickets) {
    if (completedTickets.length === 0) return '0';
    
    const totalTime = completedTickets.reduce((sum, ticket) => {
      return sum + (ticket.actual_service_time || 0);
    }, 0);
    
    return (totalTime / completedTickets.length).toFixed(1);
  }

  calculateEfficiencyScore(avgServiceTime, ticketsServed) {
    // Lower service time is better, more tickets served is better
    const timeScore = Math.max(0, 100 - (avgServiceTime * 2));
    const volumeScore = Math.min(100, ticketsServed * 10);
    
    return ((timeScore * 0.6) + (volumeScore * 0.4)).toFixed(2);
  }

  calculateCounterEfficiency(counter) {
    if (!counter.currentTicket || counter.status !== 'busy') {
      return { status: 'Idle', score: 0 };
    }

    const now = new Date();
    const startTime = counter.currentTicket.serving_started_at || counter.currentTicket.called_at;
    
    if (!startTime) return { status: 'Starting', score: 50 };

    const serviceMinutes = Math.floor((now - startTime) / 60000);
    const service = counter.currentTicket.ticketService;
    const estimatedTime = service?.estimated_time || 15;

    if (serviceMinutes < estimatedTime * 0.5) {
      return { status: 'Fast', score: 90 };
    } else if (serviceMinutes < estimatedTime) {
      return { status: 'Normal', score: 70 };
    } else if (serviceMinutes < estimatedTime * 1.5) {
      return { status: 'Slow', score: 40 };
    } else {
      return { status: 'Very Slow', score: 20 };
    }
  }

  generateRecommendations(tickets, serviceStats, counterStats) {
    const recommendations = [];

    // Check peak hours
    const hourlyCounts = {};
    tickets.forEach(ticket => {
      const hour = ticket.createdAt.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyCounts).reduce((a, b) => 
      hourlyCounts[a] > hourlyCounts[b] ? a : b
    );

    if (hourlyCounts[peakHour] > 10) {
      recommendations.push({
        type: 'staffing',
        priority: 'high',
        message: `Peak hour detected at ${peakHour}:00`,
        suggestion: 'Consider adding extra staff during this period'
      });
    }

    // Check service bottlenecks
    const slowServices = serviceStats.filter(s => 
      s.avg_service_time > 20 && s.ticket_count > 5
    );

    slowServices.forEach(service => {
      recommendations.push({
        type: 'process',
        priority: 'medium',
        message: `${service.service} has high average service time (${service.avg_service_time} min)`,
        suggestion: 'Review process or provide additional training'
      });
    });

    // Check counter performance
    const underperformingCounters = counterStats.filter(c => 
      c.avg_service_time > 25 && c.tickets_served > 3
    );

    if (underperformingCounters.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${underperformingCounters.length} counter(s) with high service times`,
        suggestion: 'Review staffing or provide additional support'
      });
    }

    // Check completion rate
    const completed = tickets.filter(t => t.status === 'completed').length;
    const completionRate = (completed / tickets.length) * 100;

    if (completionRate < 70) {
      recommendations.push({
        type: 'efficiency',
        priority: 'high',
        message: `Low completion rate: ${completionRate.toFixed(1)}%`,
        suggestion: 'Review queue management and resource allocation'
      });
    }

    return recommendations;
  }
}

module.exports = new StatsService();