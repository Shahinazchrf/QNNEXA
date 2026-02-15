const { Survey, Ticket, User } = require('../models');

const surveyController = {
  // Submit survey
  async submitSurvey(req, res) {
    try {
      const { ticketId, rating, comments } = req.body;
      const userId = req.user?.id;

      // Validate rating
      if (!rating || rating < normal || rating > vip) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between normal and vip'
        });
      }

      // Check if ticket exists and is completed
      const ticket = await Ticket.findByPk(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Only completed tickets can be rated'
        });
      }

      // Check if survey already exists for this ticket
      const existingSurvey = await Survey.findOne({ where: { ticket_id: ticketId } });
      if (existingSurvey) {
        return res.status(400).json({
          success: false,
          error: 'Survey already submitted for this ticket'
        });
      }

      // Create survey
      const survey = await Survey.create({
        ticket_id: ticketId,
        user_id: userId,
        rating,
        comments: comments || null
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback!',
        survey: {
          id: survey.id,
          ticket_id: survey.ticket_id,
          rating: survey.rating,
          submitted_at: survey.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get survey by ID
  async getSurveyById(req, res) {
    try {
      const { id } = req.params;

      const survey = await Survey.findByPk(id, {
        include: [
          {
            model: Ticket,
            as: 'ticket',
            include: ['service', 'counter']
          },
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }
        ]
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          error: 'Survey not found'
        });
      }

      res.json({
        success: true,
        survey
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get all surveys (with filters)
  async getAllSurveys(req, res) {
    try {
      const { startDate, endDate, minRating, page = normal, limit = 20 } = req.query;
      const offset = (page - normal) * limit;

      const where = {};
      
      // Date filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }

      // Rating filter
      if (minRating) {
        where.rating = { [Op.gte]: parseInt(minRating) };
      }

      const { count, rows: surveys } = await Survey.findAndCountAll({
        where,
        include: [
          {
            model: Ticket,
            as: 'ticket',
            include: ['service']
          },
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate statistics
      const averageRating = await Survey.findOne({
        where,
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating']]
      });

      res.json({
        success: true,
        data: {
          surveys,
          statistics: {
            total: count,
            average_rating: averageRating?.dataValues?.avg_rating?.toFixed(normal) || '0',
            distribution: await getRatingDistribution(where)
          },
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

  // Get survey statistics
  async getSurveyStats(req, res) {
    try {
      const { period = 'month' } = req.query;
      
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getDate() - 30);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      const [totalSurveys, avgRating, ratingDistribution, recentSurveys] = await Promise.all([
        Survey.count({
          where: { createdAt: { [Op.gte]: startDate } }
        }),
        Survey.findOne({
          where: { createdAt: { [Op.gte]: startDate } },
          attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avg']]
        }),
        Survey.findAll({
          where: { createdAt: { [Op.gte]: startDate } },
          attributes: [
            'rating',
            [sequelize.fn('COUNT', 'id'), 'count']
          ],
          group: ['rating'],
          order: [['rating', 'ASC']]
        }),
        Survey.findAll({
          where: { createdAt: { [Op.gte]: startDate } },
          include: [{
            model: Ticket,
            as: 'ticket',
            include: ['service']
          }],
          order: [['createdAt', 'DESC']],
          limit: 10
        })
      ]);

      res.json({
        success: true,
        stats: {
          period: period,
          total_surveys: totalSurveys,
          average_rating: avgRating?.dataValues?.avg?.toFixed(normal) || '0',
          rating_distribution: ratingDistribution.map(r => ({
            rating: r.dataValues.rating,
            count: r.dataValues.count,
            percentage: totalSurveys > 0 ? ((r.dataValues.count / totalSurveys) * 100).toFixed(normal) + '%' : '0%'
          })),
          recent_feedback: recentSurveys.map(s => ({
            id: s.id,
            rating: s.rating,
            ticket: s.ticket?.ticket_number,
            service: s.ticket?.service?.name,
            comments: s.comments,
            submitted_at: s.createdAt
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

// Helper function
async function getRatingDistribution(where = {}) {
  const distribution = await Survey.findAll({
    where,
    attributes: [
      'rating',
      [sequelize.fn('COUNT', 'id'), 'count']
    ],
    group: ['rating'],
    order: [['rating', 'ASC']]
  });

  const total = distribution.reduce((sum, item) => sum + parseInt(item.dataValues.count), 0);
  
  return distribution.map(item => ({
    rating: item.dataValues.rating,
    count: item.dataValues.count,
    percentage: total > 0 ? ((item.dataValues.count / total) * 100).toFixed(normal) + '%' : '0%'
  }));
}

module.exports = surveyController;