const { Ticket, Service, Counter, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const statsController = {
  // Get daily statistics
  async getDailyStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        ticketsByHour,
        serviceDistribution,
        priorityStats,
        completionRate,
        avgServiceTimes
      ] = await Promise.all([
        // Tickets by hour
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          },
          attributes: [
            [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
            [sequelize.fn('COUNT', 'id'), 'count']
          ],
          group: [sequelize.fn('strftime', '%H', sequelize.col('createdAt'))],
          order: [[sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'ASC']]
        }),

        // Service distribution - FIXED: Changed from 'Service.code' to 'Service.name'
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          },
          include: [{ model: Service, as: 'ticketService' }], // FIXED: Added alias
          attributes: [
            'ticketService.name', // FIXED: Changed from 'Service.code' to 'ticketService.name'
            [sequelize.fn('COUNT', 'Ticket.id'), 'count']
          ],
          group: ['ticketService.id'], // FIXED: Changed group by alias
          order: [[sequelize.fn('COUNT', 'Ticket.id'), 'DESC']]
        }),

        // Priority statistics
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          },
          attributes: [
            'priority',
            [sequelize.fn('COUNT', 'id'), 'count'],
            [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_service_time']
          ],
          group: ['priority']
        }),

        // Completion rate
        Ticket.findAndCountAll({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          }
        }),

        // Average service times by counter
        Ticket.findAll({
          where: {
            status: 'completed',
            completed_at: { [Op.between]: [today, tomorrow] }
          },
          include: [{ model: Counter, as: 'ticketCounter' }], // FIXED: Added alias
          attributes: [
            'counter_id',
            [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_time'],
            [sequelize.fn('COUNT', 'id'), 'ticket_count']
          ],
          group: ['ticketCounter.id'], // FIXED: Changed group by alias
          having: sequelize.where(sequelize.fn('COUNT', 'id'), '>', 0)
        })
      ]);

      const totalTickets = completionRate.count;
      const completedTickets = await Ticket.count({
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [today, tomorrow] }
        }
      });

      res.json({
        success: true,
        daily_stats: {
          date: today.toISOString().split('T')[0],
          summary: {
            total_tickets: totalTickets,
            completed_tickets: completedTickets,
            completion_rate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%',
            avg_tickets_per_hour: (totalTickets / 24).toFixed(1)
          },
          hourly_distribution: ticketsByHour.map(h => ({
            hour: h.dataValues.hour + ':00',
            tickets: h.dataValues.count
          })),
          // FIXED: Changed from 'Service?.code' to 'ticketService?.name'
          service_breakdown: serviceDistribution.map(s => ({
            service: s.ticketService?.name || 'Unknown', // FIXED: Changed from s.Service?.code
            count: s.dataValues.count,
            percentage: totalTickets > 0 ? ((s.dataValues.count / totalTickets) * 100).toFixed(1) + '%' : '0%'
          })),
          priority_analysis: priorityStats.map(p => ({
            priority: p.dataValues.priority,
            count: p.dataValues.count,
            avg_service_time: p.dataValues.avg_service_time?.toFixed(1) || 'N/A'
          })),
          counter_performance: avgServiceTimes.map(c => ({
            counter_id: c.dataValues.counter_id,
            avg_service_time: c.dataValues.avg_time?.toFixed(1) + ' min' || 'N/A',
            tickets_served: c.dataValues.ticket_count
          }))
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get weekly/monthly statistics
  async getPeriodStats(req, res) {
    try {
      const { period = 'week' } = req.query;
      
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setDate(startDate.getDate() - 30); // Default 30 days
      }
      
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();

      const [
        dailyTrends,
        serviceTrends,
        employeePerformance,
        peakHours
      ] = await Promise.all([
        // Daily trends
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', 'id'), 'total'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
            [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_service_time']
          ],
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        }),

        // Service trends - FIXED: Changed from 'Service.code' to 'ticketService.name'
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          include: [{ model: Service, as: 'ticketService' }], // FIXED: Added alias
          attributes: [
            'ticketService.name', // FIXED: Changed from 'Service.code'
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', 'Ticket.id'), 'count']
          ],
          group: ['ticketService.id', sequelize.fn('DATE', sequelize.col('createdAt'))], // FIXED: Changed group by alias
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        }),

        // Employee performance
        Ticket.findAll({
          where: {
            status: 'completed',
            completed_at: { [Op.between]: [startDate, endDate] }
          },
          include: [{
            model: Counter,
            as: 'ticketCounter', // FIXED: Added alias
            include: [{
              model: User,
              as: 'counterEmployee', // FIXED: Added alias
              attributes: ['first_name', 'last_name']
            }]
          }],
          attributes: [
            'counter_id',
            [sequelize.fn('COUNT', 'id'), 'tickets_served'],
            [sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'avg_service_time'],
            [sequelize.fn('MIN', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'min_service_time'],
            [sequelize.fn('MAX', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'max_service_time']
          ],
          group: ['ticketCounter.id'], // FIXED: Changed group by alias
          having: sequelize.where(sequelize.fn('COUNT', 'id'), '>', 0),
          order: [[sequelize.fn('AVG', sequelize.literal('julianday(completed_at) - julianday(called_at)') * 24 * 60), 'ASC']]
        }),

        // Peak hours analysis
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          attributes: [
            [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
            [sequelize.fn('DAYNAME', sequelize.col('createdAt')), 'day'],
            [sequelize.fn('COUNT', 'id'), 'count']
          ],
          group: [
            sequelize.fn('strftime', '%H', sequelize.col('createdAt')),
            sequelize.fn('DAYNAME', sequelize.col('createdAt'))
          ],
          order: [
            [sequelize.fn('COUNT', 'id'), 'DESC']
          ],
          limit: 10
        })
      ]);

      // Calculate statistics
      const totalTickets = await Ticket.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      });

      const completedTickets = await Ticket.count({
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      });

      const cancelledTickets = await Ticket.count({
        where: {
          status: 'cancelled',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      });

      res.json({
        success: true,
        period_stats: {
          period: period,
          date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          overview: {
            total_tickets: totalTickets,
            completed_tickets: completedTickets,
            cancelled_tickets: cancelledTickets,
            completion_rate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%',
            cancellation_rate: totalTickets > 0 ? ((cancelledTickets / totalTickets) * 100).toFixed(1) + '%' : '0%'
          },
          daily_trends: dailyTrends.map(d => ({
            date: d.dataValues.date,
            total_tickets: d.dataValues.total,
            completed: d.dataValues.completed,
            avg_service_time: d.dataValues.avg_service_time?.toFixed(1) || 'N/A'
          })),
          // FIXED: Changed from 'Service?.code' to 'ticketService?.name'
          service_analysis: serviceTrends.reduce((acc, curr) => {
            const serviceName = curr.ticketService?.name || 'Unknown'; // FIXED: Changed from curr.Service?.code
            if (!acc[serviceName]) acc[serviceName] = [];
            acc[serviceName].push({
              date: curr.dataValues.date,
              count: curr.dataValues.count
            });
            return acc;
          }, {}),
          // FIXED: Changed Counter references to use aliases
          employee_performance: employeePerformance.map(e => ({
            counter: e.ticketCounter?.number || 'N/A', // FIXED: Changed from e.Counter?.number
            employee: e.ticketCounter?.counterEmployee ? 
              `${e.ticketCounter.counterEmployee.first_name} ${e.ticketCounter.counterEmployee.last_name}` : 
              'Unassigned',
            tickets_served: e.dataValues.tickets_served,
            avg_service_time: e.dataValues.avg_service_time?.toFixed(1) + ' min' || 'N/A',
            min_service_time: e.dataValues.min_service_time?.toFixed(1) + ' min' || 'N/A',
            max_service_time: e.dataValues.max_service_time?.toFixed(1) + ' min' || 'N/A'
          })),
          peak_hours: peakHours.map(p => ({
            hour: p.dataValues.hour + ':00',
            day: p.dataValues.day,
            ticket_count: p.dataValues.count,
            percentage: totalTickets > 0 ? ((p.dataValues.count / totalTickets) * 100).toFixed(1) + '%' : '0%'
          })),
          recommendations: generateRecommendations(dailyTrends, peakHours, employeePerformance)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get real-time statistics
  async getRealTimeStats(req, res) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        currentQueue,
        hourlyRate,
        serviceWaitTimes,
        counterStatus,
        recentActivity
      ] = await Promise.all([
        // Current queue
        Ticket.findAll({
          where: { status: 'waiting' },
          include: [{ model: Service, as: 'ticketService' }], // FIXED: Added alias
          order: [['createdAt', 'ASC']],
          limit: 20
        }),

        // Tickets per hour (current hour)
        Ticket.count({
          where: {
            createdAt: { [Op.between]: [oneHourAgo, now] }
          }
        }),

        // Estimated wait times per service
        Service.findAll({
          where: { is_active: true },
          include: [{
            model: Ticket,
            as: 'serviceTickets', // FIXED: Added alias
            where: { status: 'waiting' },
            required: false
          }]
        }),

        // Counter status
        Counter.findAll({
          where: { is_active: true },
          include: [{
            model: Ticket,
            as: 'currentTicket', // FIXED: Changed from 'current_ticket' to 'currentTicket'
            include: [{ model: Service, as: 'ticketService' }] // FIXED: Added alias
          }, {
            model: User,
            as: 'counterEmployee', // FIXED: Changed from 'employee' to 'counterEmployee'
            attributes: ['first_name', 'last_name']
          }],
          order: [['number', 'ASC']]
        }),

        // Recent activity (last 10 tickets)
        Ticket.findAll({
          order: [['createdAt', 'DESC']],
          limit: 10,
          include: [
            { model: Service, as: 'ticketService' }, // FIXED: Added alias
            { model: Counter, as: 'ticketCounter' } // FIXED: Added alias
          ]
        })
      ]);

      // Calculate current statistics
      const totalWaiting = currentQueue.length;
      const vipWaiting = currentQueue.filter(t => t.priority === 'vip').length;
      
      // Calculate average wait time for waiting tickets
      let totalWaitMinutes = 0;
      currentQueue.forEach(ticket => {
        const waitMinutes = Math.floor((now - ticket.createdAt) / 60000);
        totalWaitMinutes += waitMinutes;
      });
      const avgWaitTime = totalWaiting > 0 ? Math.floor(totalWaitMinutes / totalWaiting) : 0;

      res.json({
        success: true,
        realtime_stats: {
          timestamp: now.toISOString(),
          queue_status: {
            total_waiting: totalWaiting,
            vip_waiting: vipWaiting,
            normal_waiting: totalWaiting - vipWaiting,
            avg_wait_time: avgWaitTime + ' min',
            longest_wait: currentQueue.length > 0 ? 
              Math.floor((now - currentQueue[0].createdAt) / 60000) + ' min' : 
              '0 min'
          },
          hourly_rate: {
            tickets_last_hour: hourlyRate,
            estimated_daily: hourlyRate * 8,
            trend: hourlyRate > 20 ? 'High' : hourlyRate > 10 ? 'Medium' : 'Low'
          },
          // FIXED: Changed from 'service.code' to 'service.name'
          service_wait_times: serviceWaitTimes.map(service => {
            const waitingCount = service.serviceTickets?.length || 0;
            const estimatedWait = waitingCount * service.estimated_time;
            
            return {
              service: service.name, // FIXED: Changed from service.code
              name: service.name,
              waiting: waitingCount,
              estimated_wait: estimatedWait + ' min',
              status: estimatedWait > 30 ? 'Busy' : estimatedWait > 15 ? 'Moderate' : 'Light'
            };
          }),
          // FIXED: Updated counter references to use aliases
          counters: counterStatus.map(counter => ({
            number: counter.number,
            status: counter.status,
            employee: counter.counterEmployee ? 
              `${counter.counterEmployee.first_name} ${counter.counterEmployee.last_name}` : 
              'Unassigned',
            current_ticket: counter.currentTicket ? {
              number: counter.currentTicket.ticket_number,
              service: counter.currentTicket.ticketService?.name,
              serving_for: counter.currentTicket.serving_started_at ? 
                Math.floor((now - counter.currentTicket.serving_started_at) / 60000) + ' min' : 
                'N/A'
            } : null,
            efficiency: calculateCounterEfficiency(counter)
          })),
          recent_activity: recentActivity.map(activity => ({
            ticket: activity.ticket_number,
            service: activity.ticketService?.name, // FIXED: Changed from activity.Service?.name
            action: activity.status,
            counter: activity.ticketCounter?.number || 'N/A', // FIXED: Changed from activity.Counter?.number
            time: activity.createdAt
          })),
          alerts: generateAlerts(currentQueue, counterStatus, avgWaitTime)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Helper functions
function calculateCounterEfficiency(counter) {
  if (!counter.currentTicket || counter.status !== 'busy') { // FIXED: Changed from current_ticket to currentTicket
    return { status: 'Idle', score: 0 };
  }

  const now = new Date();
  const startTime = counter.currentTicket.serving_started_at || counter.currentTicket.called_at; // FIXED: Changed from current_ticket
  
  if (!startTime) {
    return { status: 'Starting', score: 50 };
  }

  const serviceMinutes = Math.floor((now - startTime) / 60000);
  const service = counter.currentTicket.ticketService; // FIXED: Changed from Service
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

function generateAlerts(queue, counters, avgWaitTime) {
  const alerts = [];

  // Queue alerts
  if (queue.length > 20) {
    alerts.push({
      type: 'warning',
      message: `High queue length: ${queue.length} tickets waiting`,
      priority: 'high'
    });
  }

  if (avgWaitTime > 30) {
    alerts.push({
      type: 'warning',
      message: `Long average wait time: ${avgWaitTime} minutes`,
      priority: 'high'
    });
  }

  // Counter alerts
  const inactiveCounters = counters.filter(c => c.status === 'inactive' && c.is_active);
  if (inactiveCounters.length > 0) {
    alerts.push({
      type: 'info',
      message: `${inactiveCounters.length} counter(s) inactive`,
      priority: 'medium'
    });
  }

  const unassignedCounters = counters.filter(c => !c.employee && c.is_active);
  if (unassignedCounters.length > 0) {
    alerts.push({
      type: 'info',
      message: `${unassignedCounters.length} counter(s) without employee`,
      priority: 'low'
    });
  }

  return alerts;
}

function generateRecommendations(dailyTrends, peakHours, employeePerformance) {
  const recommendations = [];

  // Analyze peak hours
  if (peakHours.length > 0) {
    const busiestHour = peakHours[0];
    recommendations.push({
      type: 'staffing',
      message: `Peak hour detected: ${busiestHour.hour} on ${busiestHour.day}`,
      suggestion: 'Consider adding extra staff during this period'
    });
  }

  // Analyze employee performance
  if (employeePerformance.length > 0) {
    const slowestEmployee = employeePerformance[employeePerformance.length - 1];
    if (slowestEmployee.avg_service_time && parseFloat(slowestEmployee.avg_service_time) > 20) {
      recommendations.push({
        type: 'training',
        message: `${slowestEmployee.employee} has average service time of ${slowestEmployee.avg_service_time}`,
        suggestion: 'Consider additional training or support'
      });
    }
  }

  // Check completion rates
  const recentDay = dailyTrends[dailyTrends.length - 1];
  if (recentDay && recentDay.dataValues.completed < recentDay.dataValues.total * 0.7) {
    recommendations.push({
      type: 'efficiency',
      message: `Low completion rate on ${recentDay.dataValues.date}: ${recentDay.dataValues.completed}/${recentDay.dataValues.total}`,
      suggestion: 'Review queue management procedures'
    });
  }

  return recommendations;
}

module.exports = statsController;