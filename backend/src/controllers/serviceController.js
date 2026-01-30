// controllers/serviceController.js
const { Service, Ticket } = require('../models');
const { Op } = require('sequelize');

const serviceController = {
  // Get all services
  async getAllServices(req, res) {
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

  // Get service by ID
  async getServiceById(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findByPk(id, {
        include: [{
          model: Ticket,
          as: 'service_tickets',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }]
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get service by code
  async getServiceByCode(req, res) {
    try {
      const { code } = req.params;

      const service = await Service.findOne({
        where: { code: code.toUpperCase() }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Create new service
  async createService(req, res) {
    try {
      const { code, name, estimated_time, description } = req.body;

      // Validate required fields
      if (!code || !name) {
        return res.status(400).json({
          success: false,
          error: 'Code and name are required'
        });
      }

      // Check if service code exists
      const existingService = await Service.findOne({ 
        where: { code: code.toUpperCase() } 
      });
      if (existingService) {
        return res.status(400).json({
          success: false,
          error: `Service code ${code} already exists`
        });
      }

      const service = await Service.create({
        code: code.toUpperCase(),
        name,
        estimated_time: estimated_time || 15,
        description: description || null,
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

  // Update service
  async updateService(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      // Don't allow updating code if it would cause duplicate
      if (updates.code && updates.code !== service.code) {
        const existingService = await Service.findOne({ 
          where: { code: updates.code.toUpperCase() } 
        });
        if (existingService) {
          return res.status(400).json({
            success: false,
            error: `Service code ${updates.code} already exists`
          });
        }
      }

      // Uppercase code if provided
      if (updates.code) {
        updates.code = updates.code.toUpperCase();
      }

      await service.update(updates);

      res.json({
        success: true,
        message: 'Service updated successfully',
        service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete service (soft delete)
  async deleteService(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      // Check if service has active tickets
      const activeTickets = await Ticket.count({
        where: { 
          service_id: id,
          status: { [Op.in]: ['waiting', 'called', 'serving'] }
        }
      });

      if (activeTickets > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete service with ${activeTickets} active tickets`
        });
      }

      // Soft delete (deactivate)
      await service.update({ is_active: false });

      res.json({
        success: true,
        message: 'Service deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get service statistics
  async getServiceStats(req, res) {
    try {
      const { id } = req.params;
      const { period = 'day' } = req.query;

      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      // Calculate date range
      let startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const endDate = new Date();

      const [
        totalTickets,
        completedTickets,
        avgWaitTime,
        avgServiceTime,
        hourlyDistribution
      ] = await Promise.all([
        // Total tickets
        Ticket.count({ 
          where: { 
            service_id: id,
            createdAt: { [Op.between]: [startDate, endDate] }
          }
        }),

        // Completed tickets
        Ticket.count({ 
          where: { 
            service_id: id,
            status: 'completed',
            createdAt: { [Op.between]: [startDate, endDate] }
          }
        }),

        // Average wait time
        Ticket.findOne({
          where: { 
            service_id: id,
            status: 'completed',
            called_at: { [Op.not]: null },
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          attributes: [[sequelize.fn('AVG', sequelize.literal('julianday(called_at) - julianday(createdAt)') * 24 * 60), 'avg_wait']]
        }),

        // Average service time
        Ticket.findOne({
          where: { 
            service_id: id,
            status: 'completed',
            actual_service_time: { [Op.not]: null },
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          attributes: [[sequelize.fn('AVG', sequelize.col('actual_service_time')), 'avg_service']]
        }),

        // Hourly distribution
        Ticket.findAll({
          where: { 
            service_id: id,
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          attributes: [
            [sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'hour'],
            [sequelize.fn('COUNT', 'id'), 'count']
          ],
          group: [sequelize.fn('strftime', '%H', sequelize.col('createdAt'))],
          order: [[sequelize.fn('strftime', '%H', sequelize.col('createdAt')), 'ASC']]
        })
      ]);

      res.json({
        success: true,
        stats: {
          service_id: id,
          service_code: service.code,
          service_name: service.name,
          period: period,
          total_tickets: totalTickets,
          completed_tickets: completedTickets,
          completion_rate: totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%',
          average_wait_time: avgWaitTime?.dataValues?.avg_wait?.toFixed(1) || '0',
          average_service_time: avgServiceTime?.dataValues?.avg_service?.toFixed(1) || '0',
          estimated_time: service.estimated_time,
          is_active: service.is_active,
          hourly_distribution: hourlyDistribution.map(h => ({
            hour: h.dataValues.hour + ':00',
            tickets: h.dataValues.count
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

  // Get services with waiting tickets
  async getServicesWithWaiting(req, res) {
    try {
      const services = await Service.findAll({
        where: { is_active: true },
        include: [{
          model: Ticket,
          as: 'service_tickets',
          where: { status: 'waiting' },
          required: false
        }]
      });

      const servicesWithStats = services.map(service => ({
        id: service.id,
        code: service.code,
        name: service.name,
        estimated_time: service.estimated_time,
        waiting_tickets: service.service_tickets?.length || 0,
        estimated_wait: (service.estimated_time * (service.service_tickets?.length || 0))
      }));

      res.json({
        success: true,
        services: servicesWithStats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = serviceController;