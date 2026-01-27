const { User, Ticket, Service, Counter, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const adminController = {
  // Get comprehensive dashboard
  async getDashboard(req, res) {
    try {
      // Today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Last 7 days
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Parallel queries for performance
      const [
        totalTickets,
        todayTickets,
        activeUsers,
        activeCounters,
        waitingTickets,
        servingTickets,
        serviceStats,
        hourlyStats,
        recentTickets
      ] = await Promise.all([
        // Total tickets
        Ticket.count(),

        // Today's tickets
        Ticket.count({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          }
        }),

        // Active users
        User.count({ where: { is_active: true } }),

        // Active counters
        Counter.count({ where: { status: 'active' } }),

        // Waiting tickets
        Ticket.count({ where: { status: 'waiting' } }),

        // Serving tickets
        Ticket.count({ where: { status: 'serving' } }),

        // Service statistics
        Ticket.findAll({
          include: [Service],
          where: {
            createdAt: { [Op.between]: [lastWeek, tomorrow] }
          },
          attributes: [
            'Service.code',
            [sequelize.fn('COUNT', 'Ticket.id'), 'ticket_count'],
            [sequelize.fn('AVG', sequelize.literal('julianday(Ticket.completed_at) - julianday(Ticket.called_at)') * 24 * 60), 'avg_service_time']
          ],
          group: ['Service.id']
        }),

        // Hourly ticket generation stats (today)
        Ticket.findAll({
          where: {
            createdAt: { [Op.between]: [today, tomorrow] }
          },
          attributes: [
            [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
            [sequelize.fn('COUNT', 'id'), 'ticket_count']
          ],
          group: [sequelize.fn('strftime', '%H', sequelize.col('createdAt'))],
          order: [[sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'ASC']]
        }),

        // Recent tickets
        Ticket.findAll({
          include: [Service, Counter],
          order: [['createdAt', 'DESC']],
          limit: 10
        })
      ]);

      // Calculate statistics
      const completionRate = todayTickets > 0 
        ? ((todayTickets - waitingTickets) / todayTickets * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        dashboard: {
          overview: {
            total_tickets: totalTickets,
            today_tickets: todayTickets,
            active_users: activeUsers,
            active_counters: activeCounters,
            completion_rate: completionRate + '%'
          },
          current_queue: {
            waiting: waitingTickets,
            serving: servingTickets,
            total_active: waitingTickets + servingTickets
          },
          service_analytics: serviceStats.map(stat => ({
            service: stat.Service?.code,
            ticket_count: stat.dataValues.ticket_count,
            avg_service_time: stat.dataValues.avg_service_time?.toFixed(1) || 'N/A'
          })),
          hourly_distribution: hourlyStats.map(stat => ({
            hour: stat.dataValues.hour + ':00',
            tickets: stat.dataValues.ticket_count
          })),
          recent_activity: recentTickets.map(ticket => ({
            id: ticket.id,
            number: ticket.ticket_number,
            service: ticket.Service?.name,
            status: ticket.status,
            counter: ticket.Counter?.number,
            created_at: ticket.createdAt
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

  // Manage users (CRUD)
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (role) where.role = role;
      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'createdAt', 'last_login'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async createUser(req, res) {
    try {
      const { email, password, first_name, last_name, role, phone } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: role || 'client',
        phone,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          is_active: user.is_active
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove password from updates if present (use separate endpoint for password)
      if (updates.password) {
        delete updates.password;
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.update(updates);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Prevent deleting yourself
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Soft delete (deactivate)
      await user.update({ is_active: false });

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Manage services
  async getServices(req, res) {
    try {
      const services = await Service.findAll({
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        services
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async createService(req, res) {
    try {
      const { code, name, estimated_time, description } = req.body;

      const service = await Service.create({
        code: code.toUpperCase(),
        name,
        estimated_time: estimated_time || 15,
        description,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        service
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Manage counters
  async getCounters(req, res) {
    try {
      const counters = await Counter.findAll({
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }],
        order: [['number', 'ASC']]
      });

      res.json({
        success: true,
        counters
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async assignEmployeeToCounter(req, res) {
    try {
      const { counterId, employeeId } = req.body;

      const counter = await Counter.findByPk(counterId);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      const employee = await User.findByPk(employeeId);
      if (!employee || !['employee', 'admin'].includes(employee.role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee'
        });
      }

      await counter.update({
        employee_id: employeeId,
        status: 'active'
      });

      res.json({
        success: true,
        message: `Employee assigned to counter ${counter.number}`,
        counter: {
          id: counter.id,
          number: counter.number,
          employee: {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // System reports
  async generateReport(req, res) {
    try {
      const { startDate, endDate, reportType = 'daily' } = req.body;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const tickets = await Ticket.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        include: [Service, Counter, {
          model: User,
          as: 'client',
          attributes: ['first_name', 'last_name']
        }],
        order: [['createdAt', 'ASC']]
      });

      // Calculate statistics
      const stats = {
        total_tickets: tickets.length,
        completed_tickets: tickets.filter(t => t.status === 'completed').length,
        cancelled_tickets: tickets.filter(t => t.status === 'cancelled').length,
        avg_wait_time: 0,
        avg_service_time: 0,
        by_service: {},
        by_hour: {},
        by_priority: {
          normal: 0,
          vip: 0,
          urgent: 0
        }
      };

      // Calculate averages
      const completedTickets = tickets.filter(t => t.status === 'completed');
      if (completedTickets.length > 0) {
        const totalWait = completedTickets.reduce((sum, t) => {
          const wait = t.called_at ? (t.called_at - t.createdAt) / 60000 : 0;
          return sum + wait;
        }, 0);
        
        const totalService = completedTickets.reduce((sum, t) => {
          const service = t.completed_at ? (t.completed_at - t.called_at) / 60000 : 0;
          return sum + service;
        }, 0);
        
        stats.avg_wait_time = (totalWait / completedTickets.length).toFixed(1);
        stats.avg_service_time = (totalService / completedTickets.length).toFixed(1);
      }

      // Group by service
      tickets.forEach(ticket => {
        const serviceCode = ticket.Service?.code || 'Unknown';
        stats.by_service[serviceCode] = (stats.by_service[serviceCode] || 0) + 1;
        
        const hour = ticket.createdAt.getHours();
        stats.by_hour[hour] = (stats.by_hour[hour] || 0) + 1;
        
        stats.by_priority[ticket.priority] = (stats.by_priority[ticket.priority] || 0) + 1;
      });

      res.json({
        success: true,
        report: {
          period: `${startDate} to ${endDate}`,
          generated_at: new Date(),
          statistics: stats,
          tickets: tickets.map(t => ({
            id: t.id,
            number: t.ticket_number,
            service: t.Service?.name,
            status: t.status,
            priority: t.priority,
            created_at: t.createdAt,
            completed_at: t.completed_at,
            client: t.client ? `${t.client.first_name} ${t.client.last_name}` : 'Walk-in'
          }))
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

module.exports = adminController;