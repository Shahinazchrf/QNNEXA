// utils/queryOptimizer.js
const { sequelize } = require('../models');

class QueryOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 secondes
  }

  async getQueueStats(serviceId, useCache = true) {
    const cacheKey = `queue_stats_${serviceId}`;
    
    // Vérifier le cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

    // Requête optimisée avec raw SQL si nécessaire
    const query = `
      SELECT 
        COUNT(*) as total_waiting,
        AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())) as avg_wait_time,
        SUM(CASE WHEN is_vip = 1 THEN 1 ELSE 0 END) as vip_count
      FROM tickets 
      WHERE service_id = ? 
        AND status = 'waiting'
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;

    const [results] = await sequelize.query(query, {
      replacements: [serviceId],
      type: sequelize.QueryTypes.SELECT
    });

    // Mettre en cache
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: results
    });

    return results;
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new QueryOptimizer();