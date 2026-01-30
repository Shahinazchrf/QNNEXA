// controllers/counterController.js
const { Counter, User, Ticket, Service } = require('../models');
const { Op } = require('sequelize');

const counterController = {
  // Get all counters
  async getAllCounters(req, res) {
    try {
      const counters = await Counter.findAll({
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Ticket,
            as: 'current_ticket',
            include: [Service]
          }
        ],
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

  // Get counter by ID
  async getCounterById(req, res) {
    try {
      const { id } = req.params;

      const counter = await Counter.findByPk(id, {
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email', 'role']
          },
          {
            model: Ticket,
            as: 'current_ticket',
            include: [Service]
          },
          {
            model: Ticket,
            as: 'counter_tickets',
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [Service]
          }
        ]
      });

      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      res.json({
        success: true,
        counter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Create new counter
  async createCounter(req, res) {
    try {
      const { number, name, services, location, is_active } = req.body;

      // Check if counter number exists
      const existingCounter = await Counter.findOne({ where: { number } });
      if (existingCounter) {
        return res.status(400).json({
          success: false,
          error: `Counter number ${number} already exists`
        });
      }

      const counter = await Counter.create({
        number,
        name: name || `Counter ${number}`,
        services: services || [],
        location: location || 'Main Hall',
        is_active: is_active !== undefined ? is_active : true,
        status: 'inactive'
      });

      res.status(201).json({
        success: true,
        message: 'Counter created successfully',
        counter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update counter
  async updateCounter(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const counter = await Counter.findByPk(id);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      // Don't allow updating number if it would cause duplicate
      if (updates.number && updates.number !== counter.number) {
        const existingCounter = await Counter.findOne({ 
          where: { number: updates.number } 
        });
        if (existingCounter) {
          return res.status(400).json({
            success: false,
            error: `Counter number ${updates.number} already exists`
          });
        }
      }

      await counter.update(updates);

      res.json({
        success: true,
        message: 'Counter updated successfully',
        counter
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete counter
  async deleteCounter(req, res) {
    try {
      const { id } = req.params;

      const counter = await Counter.findByPk(id);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      // Check if counter has active ticket
      if (counter.current_ticket_id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete counter with active ticket'
        });
      }

      // Soft delete (deactivate)
      await counter.update({ is_active: false, status: 'closed' });

      res.json({
        success: true,
        message: 'Counter deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Assign employee to counter
  async assignEmployee(req, res) {
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
      if (!employee || !['employee', 'admin', 'super_admin'].includes(employee.role)) {
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
        message: `Employee ${employee.first_name} ${employee.last_name} assigned to counter ${counter.number}`,
        counter: {
          id: counter.id,
          number: counter.number,
          employee: {
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email
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

  // Remove employee from counter
  async removeEmployee(req, res) {
    try {
      const { counterId } = req.params;

      const counter = await Counter.findByPk(counterId);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      await counter.update({
        employee_id: null,
        status: 'inactive'
      });

      res.json({
        success: true,
        message: `Employee removed from counter ${counter.number}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update counter status
  async updateStatus(req, res) {
    try {
      const { counterId } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'inactive', 'busy', 'break', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const counter = await Counter.findByPk(counterId);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      // Can't set to active without an employee
      if (status === 'active' && !counter.employee_id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot set counter to active without assigned employee'
        });
      }

      await counter.update({ status });

      res.json({
        success: true,
        message: `Counter ${counter.number} status updated to ${status}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get counter statistics
  async getCounterStats(req, res) {
    try {
      const { id } = req.params;

      const counter = await Counter.findByPk(id);
      if (!counter) {
        return res.status(404).json({
          success: false,
          error: 'Counter not found'
        });
      }

      // Today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        totalTickets,
        todayTickets,
        avgServiceTime,
        efficiency
      ] = await Promise.all([
        // Total tickets served
        Ticket.count({ where: { counter_id: id } }),

        // Tickets served today
        Ticket.count({ 
          where: { 
            counter_id: id,
            status: 'completed',
            completed_at: { [Op.between]: [today, tomorrow] }
          }
        }),

        // Average service time
        Ticket.findOne({
          where: { 
            counter_id: id,
            status: 'completed',
            actual_service_time: { [Op.not]: null }
          },
          attributes: [[sequelize.fn('AVG', sequelize.col('actual_service_time')), 'avg_time']]
        }),

        // Calculate efficiency
        counter.getStatistics ? await counter.getStatistics() : { score: 50 }
      ]);

      res.json({
        success: true,
        stats: {
          counter_id: id,
          counter_number: counter.number,
          total_tickets_served: totalTickets,
          tickets_served_today: todayTickets,
          average_service_time: avgServiceTime?.dataValues?.avg_time?.toFixed(1) || '0',
          current_status: counter.status,
          employee: counter.employee_id ? 'Assigned' : 'Unassigned',
          services_count: counter.services?.length || 0,
          efficiency_score: typeof efficiency === 'number' ? efficiency : efficiency?.score || 50,
          last_updated: counter.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get available counters for a service
  async getAvailableForService(req, res) {
    try {
      const { serviceCode } = req.params;

      const service = await Service.findOne({ where: { code: serviceCode } });
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      const counters = await Counter.findAll({
        where: {
          is_active: true,
          status: { [Op.in]: ['active', 'inactive'] },
          services: { [Op.contains]: [serviceCode] }
        },
        include: [{
          model: User,
          as: 'employee',
          attributes: ['first_name', 'last_name']
        }],
        order: [['number', 'ASC']]
      });

      res.json({
        success: true,
        service: serviceCode,
        available_counters: counters.length,
        counters: counters.map(c => ({
          id: c.id,
          number: c.number,
          name: c.name,
          status: c.status,
          employee: c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : null,
          location: c.location
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = counterController;