// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const StatsService = require('../services/statsService');

// Get daily statistics (no auth for now)
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const stats = await StatsService.getDailyStats(date);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch daily statistics' 
    });
  }
});

// Get real-time statistics (no auth for now)
router.get('/realtime', async (req, res) => {
  try {
    const stats = await StatsService.getRealTimeStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch real-time statistics' 
    });
  }
});

// Get period statistics (no auth for now)
router.get('/period', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }
    
    const stats = await StatsService.getPeriodStats(
      new Date(start),
      new Date(end)
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Period stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch period statistics' 
    });
  }
});

// Get employee performance (no auth for now)
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const period = req.query.period || 'month';
    
    const performance = await StatsService.getEmployeePerformance(employeeId, period);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found or no data available'
      });
    }
    
    res.json({ success: true, data: performance });
  } catch (error) {
    console.error('Employee performance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch employee performance' 
    });
  }
});

// Get service statistics (no auth for now)
router.get('/services', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    
    const stats = await StatsService.getServiceStats(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Service stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch service statistics' 
    });
  }
});

// Get counter performance (no auth for now)
router.get('/counters', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();
    
    const stats = await StatsService.getCounterStats(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Counter stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch counter performance' 
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Stats API is working',
    endpoints: {
      daily: '/api/stats/daily',
      realtime: '/api/stats/realtime',
      period: '/api/stats/period?start=YYYY-MM-DD&end=YYYY-MM-DD',
      employee: '/api/stats/employee/:employeeId',
      services: '/api/stats/services',
      counters: '/api/stats/counters'
    }
  });
});

module.exports = router;