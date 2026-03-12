// backend/src/controllers/superAdminController.js

const { User, Agency, Service, Counter, Ticket, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const superAdminController = {
  // Dashboard principal
  getDashboard: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [
        totalAgencies,
        totalServices,
        totalCounters,
        totalUsers,
        ticketsToday
      ] = await Promise.all([
        Agency.count(),
        Service.count(),
        Counter.count(),
        User.count(),
        Ticket.count({
          where: {
            createdAt: { [Op.gte]: today }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalAgencies,
          totalServices,
          totalCounters,
          totalUsers,
          ticketsToday
        }
      });
    } catch (error) {
      console.error('❌ SuperAdmin dashboard error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Statistiques globales
  getGlobalStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const where = {};
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const stats = await Ticket.findAll({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('AVG', sequelize.col('actual_wait_time')), 'avgWaitTime'],
          [sequelize.fn('AVG', sequelize.col('actual_service_time')), 'avgServiceTime']
        ]
      });

      res.json({ success: true, data: stats[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ===== GESTION DES AGENCES =====
  getAgencies: async (req, res) => {
    try {
      const agencies = await Agency.findAll({
        include: [{
          model: Counter,
          as: 'counters',
          required: false
        }]
      });
      res.json({ success: true, data: agencies });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createAgency: async (req, res) => {
    try {
      const { code, name, address, city, is_active } = req.body;
      
      const agency = await Agency.create({
        id: uuidv4(),
        code,
        name,
        address,
        city,
        is_active: is_active !== undefined ? is_active : true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({ success: true, data: agency });
    } catch (error) {
      console.error('❌ Create agency error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateAgency: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const agency = await Agency.findByPk(id);
      if (!agency) {
        return res.status(404).json({ success: false, error: 'Agency not found' });
      }
      
      updates.updatedAt = new Date();
      await agency.update(updates);
      
      res.json({ success: true, data: agency });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteAgency: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier si l'agence a des compteurs
      const counters = await Counter.count({ where: { agency_id: id } });
      if (counters > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete agency with existing counters' 
        });
      }
      
      await Agency.destroy({ where: { id } });
      res.json({ success: true, message: 'Agency deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ===== GESTION DES SERVICES =====
  getServices: async (req, res) => {
    try {
      const services = await Service.findAll();
      res.json({ success: true, services });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createService: async (req, res) => {
    try {
      const { code, name, description, estimated_time, is_active } = req.body;
      
      const service = await Service.create({
        id: uuidv4(),
        code,
        name,
        description,
        estimated_time: estimated_time || 15,
        is_active: is_active !== undefined ? is_active : true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({ success: true, service });
    } catch (error) {
      console.error('❌ Create service error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({ success: false, error: 'Service not found' });
      }
      
      updates.updatedAt = new Date();
      await service.update(updates);
      
      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier si le service est utilisé par des tickets
      const tickets = await Ticket.count({ where: { service_id: id } });
      if (tickets > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete service with existing tickets' 
        });
      }
      
      await Service.destroy({ where: { id } });
      res.json({ success: true, message: 'Service deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ===== GESTION DES COMPTEURS =====
  getCounters: async (req, res) => {
    try {
      const counters = await Counter.findAll({
        include: [
          { model: User, as: 'counterEmployee', attributes: ['id', 'first_name', 'last_name'] },
          { model: Agency, as: 'counterAgency', attributes: ['id', 'name'] }
        ]
      });
      res.json({ success: true, counters });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createCounter: async (req, res) => {
    try {
      const { number, name, status, services, location, agency_id } = req.body;
      
      const counter = await Counter.create({
        id: uuidv4(),
        number,
        name: name || `Counter ${number}`,
        status: status || 'inactive',
        services: services || [],
        location: location || 'Main Hall',
        agency_id,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json({ success: true, counter });
    } catch (error) {
      console.error('❌ Create counter error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateCounter: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const counter = await Counter.findByPk(id);
      if (!counter) {
        return res.status(404).json({ success: false, error: 'Counter not found' });
      }
      
      updates.updatedAt = new Date();
      await counter.update(updates);
      
      res.json({ success: true, counter });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteCounter: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier si le compteur a des tickets
      const tickets = await Ticket.count({ where: { counter_id: id } });
      if (tickets > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete counter with existing tickets' 
        });
      }
      
      await Counter.destroy({ where: { id } });
      res.json({ success: true, message: 'Counter deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ===== GESTION DES UTILISATEURS =====
  getUsers: async (req, res) => {
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
      
      const users = await User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        success: true,
        data: {
          users: users.rows,
          total: users.count,
          page: parseInt(page),
          pages: Math.ceil(users.count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const { email, password, first_name, last_name, role, phone, agency_id } = req.body;
      
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password || '123456', 10);
      
      const user = await User.create({
        id: uuidv4(),
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role: role || 'employee',
        phone,
        agency_id,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Ne pas retourner le mot de passe
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.status(201).json({ success: true, user: userResponse });
    } catch (error) {
      console.error('❌ Create user error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Si le mot de passe est fourni, le hasher
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      updates.updatedAt = new Date();
      await user.update(updates);
      
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.json({ success: true, user: userResponse });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Ne pas permettre la suppression du dernier super_admin
      if (id === req.user.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete your own account' 
        });
      }
      
      await User.destroy({ where: { id } });
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const newPassword = '123456';
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await User.update(
        { password: hashedPassword, updatedAt: new Date() },
        { where: { id } }
      );
      
      res.json({ success: true, message: 'Password reset to 123456' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // ===== RAPPORTS =====
  generateReport: async (req, res) => {
    try {
      const { startDate, endDate, reportType = 'daily' } = req.body;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const tickets = await Ticket.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        include: [
          { model: Service, as: 'ticketService' },
          { model: Counter, as: 'ticketCounter' },
          { model: User, as: 'servingEmployee' }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // Statistiques
      const total = tickets.length;
      const completed = tickets.filter(t => t.status === 'completed').length;
      const waiting = tickets.filter(t => t.status === 'waiting').length;
      const called = tickets.filter(t => t.status === 'called').length;
      
      const avgWaitTime = tickets
        .filter(t => t.actual_wait_time)
        .reduce((sum, t) => sum + t.actual_wait_time, 0) / (completed || 1);
      
      res.json({
        success: true,
        report: {
          period: { start, end },
          type: reportType,
          summary: { total, completed, waiting, called },
          performance: {
            avgWaitTime: avgWaitTime.toFixed(1),
            completionRate: ((completed / total) * 100).toFixed(1) + '%'
          },
          tickets: tickets.slice(0, 100) // Limiter pour la performance
        }
      });
    } catch (error) {
      console.error('❌ Generate report error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = superAdminController;