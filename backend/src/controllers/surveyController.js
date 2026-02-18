const { Survey, Ticket, Service } = require('../models');
const { Op } = require('sequelize');

const surveyController = {
  // Submit survey
  async submitSurvey(req, res) {
    try {
      const { ticket_id, rating, comments } = req.body;

      if (!ticket_id || !rating) {
        return res.status(400).json({
          success: false,
          error: 'Ticket ID and rating are required'
        });
      }

      // Check if ticket exists
      const ticket = await Ticket.findByPk(ticket_id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Check if survey already exists
      const existingSurvey = await Survey.findOne({ where: { ticket_id } });
      if (existingSurvey) {
        return res.status(400).json({
          success: false,
          error: 'Survey already submitted for this ticket'
        });
      }

      // Create survey - ONLY columns that exist in your database
      const survey = await Survey.create({
        ticket_id,
        rating,
        comments: comments || null
      });

      // Mark ticket as having survey
      await ticket.update({ has_survey: 1 });

      res.status(201).json({
        success: true,
        message: 'Survey submitted successfully',
        survey: {
          id: survey.id,
          ticket_number: ticket.ticket_number,
          rating: survey.rating,
          submitted_at: survey.createdAt
        }
      });

    } catch (error) {
      console.error('Survey submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get survey stats
  async getSurveyStats(req, res) {
    try {
      const surveys = await Survey.findAll();
      
      if (surveys.length === 0) {
        return res.json({
          success: true,
          data: {
            total_surveys: 0,
            average_rating: 0,
            satisfaction_rate: '0%'
          }
        });
      }

      const total = surveys.length;
      const average = surveys.reduce((sum, s) => sum + s.rating, 0) / total;
      const satisfactory = surveys.filter(s => s.rating >= 4).length;
      const satisfactionRate = (satisfactory / total * 100).toFixed(1);

      res.json({
        success: true,
        data: {
          total_surveys: total,
          average_rating: parseFloat(average.toFixed(2)),
          satisfaction_rate: `${satisfactionRate}%`
        }
      });

    } catch (error) {
      console.error('Survey stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get survey by ticket ID
  async getSurveyByTicket(req, res) {
    try {
      const { ticketId } = req.params;

      const survey = await Survey.findOne({
        where: { ticket_id: ticketId },
        include: [{
          model: Ticket,
          as: 'ticketSurvey',
          attributes: ['ticket_number'],
          include: [{
            model: Service,
            as: 'ticketService',
            attributes: ['name']
          }]
        }]
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          error: 'Survey not found for this ticket'
        });
      }

      res.json({
        success: true,
        survey: {
          id: survey.id,
          ticket_number: survey.ticketSurvey?.ticket_number,
          service: survey.ticketSurvey?.ticketService?.name,
          rating: survey.rating,
          comments: survey.comments,
          submitted_at: survey.createdAt
        }
      });

    } catch (error) {
      console.error('Get survey error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get dashboard summary
  async getDashboard(req, res) {
    try {
      const total = await Survey.count();
      
      // Get average rating
      const surveys = await Survey.findAll();
      const avgRating = surveys.length > 0 
        ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(1)
        : 0;

      // Get today's surveys
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySurveys = await Survey.count({
        where: {
          createdAt: {
            [Op.gte]: today
          }
        }
      });

      res.json({
        success: true,
        data: {
          total_surveys: total,
          average_rating: avgRating,
          today_surveys: todaySurveys
        }
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = surveyController;