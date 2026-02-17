const { Survey, Ticket, Counter, User, Service, sequelize } = require('../models');
const { Op } = require('sequelize');

const surveyController = {
  async submitSurvey(req, res) {
    try {
      const { 
        ticket_id, 
        rating,
        waiting_time_rating,
        service_quality_rating,
        employee_politeness_rating,
        overall_experience,
        would_recommend,
        comments,
        is_anonymous = false
      } = req.body;

      if (!ticket_id || !rating) {
        return res.status(400).json({
          success: false,
          error: 'Ticket ID and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      const ticket = await Ticket.findOne({
        where: {
          [Op.or]: [
            { id: ticket_id },
            { ticket_number: ticket_id }
          ]
        },
        include: [
          { 
            model: Counter, 
            as: 'ticketCounter',
            attributes: ['id', 'number', 'name']
          },
          { 
            model: User, 
            as: 'servingEmployee',
            attributes: ['id', 'first_name', 'last_name']
          },
          { 
            model: User, 
            as: 'ticketClient',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      if (ticket.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Survey can only be submitted for completed tickets'
        });
      }

      const existingSurvey = await Survey.findOne({
        where: { ticket_id: ticket.id }
      });

      if (existingSurvey) {
        return res.status(400).json({
          success: false,
          error: 'Survey already submitted for this ticket'
        });
      }

      let submitted_by_client_id = null;
      if (!is_anonymous && ticket.client_id) {
        submitted_by_client_id = ticket.client_id;
      }

      const survey = await Survey.create({
        ticket_id: ticket.id,
        rating,
        waiting_time_rating: waiting_time_rating || null,
        service_quality_rating: service_quality_rating || null,
        employee_politeness_rating: employee_politeness_rating || null,
        overall_experience: overall_experience || null,
        would_recommend: would_recommend || null,
        comments: comments || null,
        counter_id: ticket.counter_id,
        employee_id: ticket.employee_id,
        submitted_by_client_id: submitted_by_client_id,
        is_anonymous: is_anonymous,
        completion_date: new Date()
      });

      await ticket.update({
        has_survey: true
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback!',
        data: {
          survey_id: survey.id,
          ticket_number: ticket.ticket_number,
          rating: survey.rating,
          rating_category: survey.getRatingCategory(),
          nps_category: survey.calculateNPS(),
          submitted_at: survey.createdAt,
          thank_you_note: 'Your feedback helps us improve our services.'
        }
      });

    } catch (error) {
      console.error('❌ Submit survey error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to submit survey'
      });
    }
  },

  async getSurveyStats(req, res) {
    try {
      const { counterId, startDate, endDate, employeeId, period = '30days' } = req.query;
      const { user } = req;

      let whereClause = {};
      
      if (user.role === 'employee' && user.counter_id) {
        whereClause.counter_id = user.counter_id;
      } else if (user.role === 'admin' && counterId) {
        whereClause.counter_id = counterId;
      } else if (user.role === 'super_admin' && counterId) {
        whereClause.counter_id = counterId;
      }

      if (employeeId) {
        whereClause.employee_id = employeeId;
      }

      let dateRange = {};
      const now = new Date();

      switch(period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateRange = { createdAt: { [Op.gte]: today } };
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const endYesterday = new Date(yesterday);
          endYesterday.setHours(23, 59, 59, 999);
          dateRange = { createdAt: { [Op.between]: [yesterday, endYesterday] } };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateRange = { createdAt: { [Op.gte]: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateRange = { createdAt: { [Op.gte]: monthAgo } };
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateRange = { createdAt: { [Op.between]: [start, end] } };
          }
          break;
        default:
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateRange = { createdAt: { [Op.gte]: thirtyDaysAgo } };
      }

      whereClause = { ...whereClause, ...dateRange };

      const surveys = await Survey.findAll({
        where: whereClause,
        include: [
          { 
            model: Counter, 
            as: 'counter',
            attributes: ['id', 'number', 'name', 'location']
          },
          { 
            model: User, 
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          { 
            model: Ticket, 
            as: 'ticket',
            attributes: ['id', 'ticket_number', 'service_id', 'createdAt', 'completed_at'],
            include: [
              {
                model: Service,
                as: 'ticketService',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (surveys.length === 0) {
        return res.json({
          success: true,
          message: 'No survey data available for the selected period',
          data: {
            summary: {
              total_surveys: 0,
              average_rating: 0,
              satisfaction_rate: '0%',
              nps_score: 0,
              response_rate: '0%'
            },
            rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            detailed_ratings: {},
            recent_surveys: []
          }
        });
      }

      const totalSurveys = surveys.length;
      const avgRating = surveys.reduce((sum, s) => sum + s.rating, 0) / totalSurveys;
      const avgWaiting = surveys.filter(s => s.waiting_time_rating)
        .reduce((sum, s) => sum + s.waiting_time_rating, 0) / surveys.filter(s => s.waiting_time_rating).length || 0;
      const avgServiceQuality = surveys.filter(s => s.service_quality_rating)
        .reduce((sum, s) => sum + s.service_quality_rating, 0) / surveys.filter(s => s.service_quality_rating).length || 0;
      const avgPoliteness = surveys.filter(s => s.employee_politeness_rating)
        .reduce((sum, s) => sum + s.employee_politeness_rating, 0) / surveys.filter(s => s.employee_politeness_rating).length || 0;
      const avgOverall = surveys.filter(s => s.overall_experience)
        .reduce((sum, s) => sum + s.overall_experience, 0) / surveys.filter(s => s.overall_experience).length || 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      surveys.forEach(s => {
        ratingDistribution[s.rating] = (ratingDistribution[s.rating] || 0) + 1;
      });

      const satisfactory = surveys.filter(s => s.rating >= 4).length;
      const satisfactionRate = (satisfactory / totalSurveys * 100).toFixed(1);

      const promoters = surveys.filter(s => s.rating >= 4).length;
      const detractors = surveys.filter(s => s.rating <= 2).length;
      const npsScore = ((promoters - detractors) / totalSurveys * 100).toFixed(1);

      const wouldRecommendCount = surveys.filter(s => s.would_recommend === true).length;
      const recommendPercentage = totalSurveys > 0 ? (wouldRecommendCount / totalSurveys * 100).toFixed(1) : 0;

      const employeePerformance = {};
      surveys.forEach(s => {
        if (s.employee) {
          const empId = s.employee.id;
          if (!employeePerformance[empId]) {
            employeePerformance[empId] = {
              employee_id: empId,
              employee_name: `${s.employee.first_name} ${s.employee.last_name}`,
              total_surveys: 0,
              total_rating: 0,
              satisfactory_count: 0,
              detailed_ratings: {
                waiting_time: { total: 0, sum: 0 },
                service_quality: { total: 0, sum: 0 },
                politeness: { total: 0, sum: 0 },
                overall: { total: 0, sum: 0 }
              }
            };
          }
          
          employeePerformance[empId].total_surveys++;
          employeePerformance[empId].total_rating += s.rating;
          if (s.rating >= 4) employeePerformance[empId].satisfactory_count++;
          
          if (s.waiting_time_rating) {
            employeePerformance[empId].detailed_ratings.waiting_time.total++;
            employeePerformance[empId].detailed_ratings.waiting_time.sum += s.waiting_time_rating;
          }
          if (s.service_quality_rating) {
            employeePerformance[empId].detailed_ratings.service_quality.total++;
            employeePerformance[empId].detailed_ratings.service_quality.sum += s.service_quality_rating;
          }
          if (s.employee_politeness_rating) {
            employeePerformance[empId].detailed_ratings.politeness.total++;
            employeePerformance[empId].detailed_ratings.politeness.sum += s.employee_politeness_rating;
          }
          if (s.overall_experience) {
            employeePerformance[empId].detailed_ratings.overall.total++;
            employeePerformance[empId].detailed_ratings.overall.sum += s.overall_experience;
          }
        }
      });

      Object.values(employeePerformance).forEach(emp => {
        emp.average_rating = (emp.total_rating / emp.total_surveys).toFixed(2);
        emp.satisfaction_rate = (emp.satisfactory_count / emp.total_surveys * 100).toFixed(1) + '%';
        
        if (emp.detailed_ratings.waiting_time.total > 0) {
          emp.detailed_ratings.waiting_time.average = 
            (emp.detailed_ratings.waiting_time.sum / emp.detailed_ratings.waiting_time.total).toFixed(2);
        }
        if (emp.detailed_ratings.service_quality.total > 0) {
          emp.detailed_ratings.service_quality.average = 
            (emp.detailed_ratings.service_quality.sum / emp.detailed_ratings.service_quality.total).toFixed(2);
        }
        if (emp.detailed_ratings.politeness.total > 0) {
          emp.detailed_ratings.politeness.average = 
            (emp.detailed_ratings.politeness.sum / emp.detailed_ratings.politeness.total).toFixed(2);
        }
        if (emp.detailed_ratings.overall.total > 0) {
          emp.detailed_ratings.overall.average = 
            (emp.detailed_ratings.overall.sum / emp.detailed_ratings.overall.total).toFixed(2);
        }
      });

      const recentSurveys = surveys.slice(0, 10).map(s => ({
        id: s.id,
        ticket_number: s.ticket?.ticket_number || 'N/A',
        service: s.ticket?.ticketService?.name || 'N/A',
        rating: s.rating,
        rating_category: s.getRatingCategory(),
        comments: s.comments ? 
          (s.comments.length > 100 ? s.comments.substring(0, 100) + '...' : s.comments) 
          : null,
        counter: s.counter ? `Counter ${s.counter.number}` : 'N/A',
        employee: s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : 'Unknown',
        submitted_at: s.createdAt,
        would_recommend: s.would_recommend
      }));

      res.json({
        success: true,
        data: {
          summary: {
            total_surveys: totalSurveys,
            average_rating: avgRating.toFixed(2),
            satisfaction_rate: `${satisfactionRate}%`,
            nps_score: parseFloat(npsScore),
            would_recommend_percentage: `${recommendPercentage}%`,
            period: period,
            date_range: {
              start: dateRange.createdAt ? dateRange.createdAt[Op.gte] || dateRange.createdAt[Op.between][0] : 'N/A',
              end: dateRange.createdAt ? dateRange.createdAt[Op.lte] || dateRange.createdAt[Op.between][1] : 'N/A'
            }
          },
          detailed_ratings: {
            waiting_time: avgWaiting ? avgWaiting.toFixed(2) : 'N/A',
            service_quality: avgServiceQuality ? avgServiceQuality.toFixed(2) : 'N/A',
            employee_politeness: avgPoliteness ? avgPoliteness.toFixed(2) : 'N/A',
            overall_experience: avgOverall ? avgOverall.toFixed(2) : 'N/A'
          },
          rating_distribution: ratingDistribution,
          employee_performance: Object.values(employeePerformance),
          recent_surveys: recentSurveys,
          insights: {
            top_strength: avgServiceQuality >= avgWaiting && avgServiceQuality >= avgPoliteness ? 'Service Quality' :
                         avgWaiting >= avgServiceQuality && avgWaiting >= avgPoliteness ? 'Waiting Time' : 'Employee Politeness',
            improvement_area: avgServiceQuality <= avgWaiting && avgServiceQuality <= avgPoliteness ? 'Service Quality' :
                            avgWaiting <= avgServiceQuality && avgWaiting <= avgPoliteness ? 'Waiting Time' : 'Employee Politeness',
            overall_sentiment: avgRating >= 4 ? 'Positive' : avgRating >= 3 ? 'Neutral' : 'Negative'
          }
        }
      });

    } catch (error) {
      console.error('❌ Get survey stats error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve survey statistics'
      });
    }
  },

  async getSurveysForDashboard(req, res) {
    try {
      const { period = '30days', limit = 20 } = req.query;
      const { user } = req;

      if (!['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      let dateFilter = {};
      const now = new Date();
      
      switch(period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter = { createdAt: { [Op.gte]: today } };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { createdAt: { [Op.gte]: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFilter = { createdAt: { [Op.gte]: monthAgo } };
          break;
        default:
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { createdAt: { [Op.gte]: thirtyDaysAgo } };
      }

      const surveys = await Survey.findAll({
        where: dateFilter,
        include: [
          { 
            model: Counter, 
            as: 'counter',
            attributes: ['id', 'number', 'name', 'location']
          },
          { 
            model: User, 
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          { 
            model: Ticket, 
            as: 'ticket',
            attributes: ['id', 'ticket_number', 'service_id', 'createdAt'],
            include: [
              {
                model: Service,
                as: 'ticketService',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      const satisfactorySurveys = surveys.filter(s => s.rating >= 4).length;
      const satisfactionRate = surveys.length > 0 
        ? ((satisfactorySurveys / surveys.length) * 100).toFixed(1)
        : 0;

      const promoters = surveys.filter(s => s.rating >= 4).length;
      const detractors = surveys.filter(s => s.rating <= 2).length;
      const npsScore = surveys.length > 0 
        ? (((promoters - detractors) / surveys.length) * 100).toFixed(1)
        : 0;

      const avgWaiting = surveys.filter(s => s.waiting_time_rating)
        .reduce((sum, s) => sum + s.waiting_time_rating, 0) / surveys.filter(s => s.waiting_time_rating).length || 0;
      
      const avgServiceQuality = surveys.filter(s => s.service_quality_rating)
        .reduce((sum, s) => sum + s.service_quality_rating, 0) / surveys.filter(s => s.service_quality_rating).length || 0;

      const avgPoliteness = surveys.filter(s => s.employee_politeness_rating)
        .reduce((sum, s) => sum + s.employee_politeness_rating, 0) / surveys.filter(s => s.employee_politeness_rating).length || 0;

      const counterStats = {};
      surveys.forEach(s => {
        if (s.counter) {
          const counterId = s.counter.id;
          if (!counterStats[counterId]) {
            counterStats[counterId] = {
              counter_id: counterId,
              counter_number: s.counter.number,
              counter_name: s.counter.name,
              total_surveys: 0,
              total_rating: 0,
              satisfactory_count: 0
            };
          }
          counterStats[counterId].total_surveys++;
          counterStats[counterId].total_rating += s.rating;
          if (s.rating >= 4) counterStats[counterId].satisfactory_count++;
        }
      });

      Object.values(counterStats).forEach(counter => {
        counter.average_rating = (counter.total_rating / counter.total_surveys).toFixed(2);
        counter.satisfaction_rate = (counter.satisfactory_count / counter.total_surveys * 100).toFixed(1) + '%';
      });

      res.json({
        success: true,
        data: {
          overview: {
            total_surveys: surveys.length,
            satisfaction_rate: `${satisfactionRate}%`,
            nps_score: parseFloat(npsScore),
            average_rating: surveys.length > 0 
              ? (surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length).toFixed(2)
              : 0,
            average_waiting_rating: avgWaiting ? avgWaiting.toFixed(2) : 'N/A',
            average_service_quality: avgServiceQuality ? avgServiceQuality.toFixed(2) : 'N/A',
            average_politeness: avgPoliteness ? avgPoliteness.toFixed(2) : 'N/A',
            period: period
          },
          rating_summary: {
            '1_star': surveys.filter(s => s.rating === 1).length,
            '2_stars': surveys.filter(s => s.rating === 2).length,
            '3_stars': surveys.filter(s => s.rating === 3).length,
            '4_stars': surveys.filter(s => s.rating === 4).length,
            '5_stars': surveys.filter(s => s.rating === 5).length
          },
          counter_performance: Object.values(counterStats),
          recent_surveys: surveys.slice(0, 10).map(s => ({
            id: s.id,
            ticket_number: s.ticket?.ticket_number || 'N/A',
            rating: s.rating,
            rating_category: s.getRatingCategory(),
            comment: s.comments ? s.comments.substring(0, 100) + (s.comments.length > 100 ? '...' : '') : null,
            counter: s.counter ? `Counter ${s.counter.number}` : 'N/A',
            employee: s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : 'Unknown',
            service: s.ticket?.ticketService?.name || 'N/A',
            submitted_at: s.createdAt,
            would_recommend: s.would_recommend
          }))
        }
      });

    } catch (error) {
      console.error('❌ Dashboard surveys error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve dashboard data'
      });
    }
  },

  async getSurveyByTicket(req, res) {
    try {
      const { ticketId } = req.params;
      
      const survey = await Survey.findOne({
        where: { ticket_id: ticketId },
        include: [
          { 
            model: Ticket, 
            as: 'ticket',
            attributes: ['id', 'ticket_number', 'service_id', 'createdAt', 'completed_at', 'customer_name']
          },
          { 
            model: Counter, 
            as: 'counter',
            attributes: ['id', 'number', 'name', 'location']
          },
          { 
            model: User, 
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          { 
            model: User, 
            as: 'client',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ]
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          error: 'Survey not found for this ticket'
        });
      }

      res.json({
        success: true,
        data: {
          survey: {
            id: survey.id,
            ticket_number: survey.ticket?.ticket_number,
            rating: survey.rating,
            rating_category: survey.getRatingCategory(),
            nps_category: survey.calculateNPS(),
            waiting_time_rating: survey.waiting_time_rating,
            service_quality_rating: survey.service_quality_rating,
            employee_politeness_rating: survey.employee_politeness_rating,
            overall_experience: survey.overall_experience,
            would_recommend: survey.would_recommend,
            comments: survey.comments,
            counter: survey.counter ? {
              id: survey.counter.id,
              number: survey.counter.number,
              name: survey.counter.name,
              location: survey.counter.location
            } : null,
            employee: survey.employee ? {
              id: survey.employee.id,
              name: `${survey.employee.first_name} ${survey.employee.last_name}`,
              email: survey.employee.email
            } : null,
            client: survey.client ? {
              id: survey.client.id,
              name: `${survey.client.first_name} ${survey.client.last_name}`,
              email: survey.client.email
            } : 'Anonymous',
            is_anonymous: survey.is_anonymous,
            submitted_at: survey.createdAt,
            completion_date: survey.completion_date
          }
        }
      });

    } catch (error) {
      console.error('❌ Get survey by ticket error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve survey'
      });
    }
  },

  async getAllSurveys(req, res) {
    try {
      const { user } = req;
      
      if (!['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: surveys } = await Survey.findAndCountAll({
        include: [
          { 
            model: Ticket, 
            as: 'ticket',
            attributes: ['id', 'ticket_number', 'service_id', 'customer_name']
          },
          { 
            model: Counter, 
            as: 'counter',
            attributes: ['id', 'number', 'name']
          },
          { 
            model: User, 
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name']
          }
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          surveys: surveys.map(s => ({
            id: s.id,
            ticket_number: s.ticket?.ticket_number,
            rating: s.rating,
            rating_category: s.getRatingCategory(),
            comments: s.comments,
            counter: s.counter ? `Counter ${s.counter.number}` : 'N/A',
            employee: s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : 'Unknown',
            submitted_at: s.createdAt,
            would_recommend: s.would_recommend
          })),
          pagination: {
            total: count,
            page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Get all surveys error:', error);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve surveys'
      });
    }
  }
};

module.exports = surveyController;