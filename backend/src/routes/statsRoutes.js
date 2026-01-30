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
        include: [Service, Counter]
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
      include: [Service]
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
      const serviceName = ticket.Service?.name || 'Unknown';
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
    const result = await Ticket.findOne({
      where: {
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.literal('julianday(called_at) - julianday(createdAt)') * 24 * 60), 'avg_wait']
      ]
    });

    return result?.dataValues?.avg_wait?.toFixed(1) || '0';
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
    const result = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [Service],
      attributes: [
        'Service.code',
        [sequelize.fn('COUNT', 'Ticket.id'), 'count']
      ],
      group: ['Service.id'],
      order: [[sequelize.fn('COUNT', 'Ticket.id'), 'DESC']]
    });

    const total = result.reduce((sum, item) => sum + parseInt(item.dataValues.count), 0);

    return result.map(item => ({
      service: item.Service?.code || 'Unknown',
      name: item.Service?.name || 'Unknown',
      count: item.dataValues.count,
      percentage: total > 0 ? ((item.dataValues.count / total) * 100).toFixed(1) + '%' : '0%'
    }));
  }

  async getHourlyStats(startDate, endDate) {
    const result = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      attributes: [
        [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
        [sequelize.fn('COUNT', 'id'), 'count']
      ],
      group: [sequelize.fn('strftime', '%H', sequelize.col('createdAt'))],
      order: [[sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'ASC']]
    });

    return result.map(item => ({
      hour: item.dataValues.hour + ':00',
      tickets: item.dataValues.count
    }));
  }

  async getCountersStatus() {
    const counters = await Counter.findAll({
      where: { is_active: true },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name']
        },
        {
          model: Ticket,
          as: 'current_ticket',
          include: [Service]
        }
      ]
    });

    return counters.map(counter => ({
      id: counter.id,
      number: counter.number,
      status: counter.status,
      employee: counter.employee ? 
        `${counter.employee.first_name} ${counter.employee.last_name}` : 
        'Unassigned',
      current_ticket: counter.current_ticket ? {
        number: counter.current_ticket.ticket_number,
        service: counter.current_ticket.Service?.name,
        start_time: counter.current_ticket.serving_started_at
      } : null,
      efficiency: this.calculateCounterEfficiency(counter)
    }));
  }

  async getRecentTickets(limit = 10) {
    const tickets = await Ticket.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      include: [Service, Counter]
    });

    return tickets.map(ticket => ({
      id: ticket.id,
      number: ticket.ticket_number,
      service: ticket.Service?.name,
      status: ticket.status,
      counter: ticket.Counter?.number || 'N/A',
      created_at: ticket.createdAt
    }));
  }

  async getPeakHour() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Ticket.findOne({
      where: { createdAt: { [Op.between]: [today, tomorrow] } },
      attributes: [
        [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
        [sequelize.fn('COUNT', 'id'), 'count']
      ],
      group: [sequelize.fn('strftime', '%H', sequelize.col('createdAt'))],
      order: [[sequelize.fn('COUNT', 'id'), 'DESC']]
    });

    return result ? {
      hour: result.dataValues.hour + ':00',
      tickets: result.dataValues.count
    } : null;
  }

  async getServiceStats(startDate, endDate) {
    const result = await Ticket.findAll({
      where: {
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      include: [Service],
      attributes: [
        'Service.code',
        [sequelize.fn('COUNT', 'Ticket.id'), 'ticket_count'],
        [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_service_time']
      ],
      group: ['Service.id']
    });

    return result.map(item => ({
      service: item.Service?.code || 'Unknown',
      name: item.Service?.name || 'Unknown',
      ticket_count: item.dataValues.ticket_count,
      avg_service_time: item.dataValues.avg_service_time?.toFixed(1) || 'N/A'
    }));
  }

  async getCounterStats(startDate, endDate) {
    const result = await Ticket.findAll({
      where: {
        status: 'completed',
        completed_at: { [Op.between]: [startDate, endDate] }
      },
      include: [Counter],
      attributes: [
        'counter_id',
        [sequelize.fn('COUNT', 'id'), 'tickets_served'],
        [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_service_time']
      ],
      group: ['counter_id'],
      having: sequelize.where(sequelize.fn('COUNT', 'id'), '>', 0)
    });

    return result.map(item => ({
      counter_id: item.dataValues.counter_id,
      tickets_served: item.dataValues.tickets_served,
      avg_service_time: item.dataValues.avg_service_time?.toFixed(1) || 'N/A'
    }));
  }

  async getDailyTrends(startDate, endDate) {
    const result = await Ticket.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', 'id'), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    return result.map(item => ({
      date: item.dataValues.date,
      total_tickets: item.dataValues.total,
      completed_tickets: item.dataValues.completed,
      completion_rate: item.dataValues.total > 0 ? 
        ((item.dataValues.completed / item.dataValues.total) * 100).toFixed(1) : 0
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
    
    return ((timeScore * 0.6) + (volumeScore * 0.4)).toFixed(1);
  }

  calculateCounterEfficiency(counter) {
    if (!counter.current_ticket || counter.status !== 'busy') {
      return { status: 'Idle', score: 0 };
    }

    const now = new Date();
    const startTime = counter.current_ticket.serving_started_at || counter.current_ticket.called_at;
    
    if (!startTime) return { status: 'Starting', score: 50 };

    const serviceMinutes = Math.floor((now - startTime) / 60000);
    const service = counter.current_ticket.Service;
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
        message: `${service.name} has high average service time (${service.avg_service_time} min)`,
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