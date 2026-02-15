const NodeCache = require('node-cache');
const { sequelize } = require('../models');

class PerformanceOptimizer {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 30, // 30 secondes par défaut
      checkperiod: 60 
    });
    
    this.queryCache = new Map();
    this.slowQueries = [];
  }

  // Cache pour les requêtes fréquentes
  async cachedQuery(key, ttl, queryFn) {
    // Vérifier le cache
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Exécuter la requête
    const result = await queryFn();
    
    // Mettre en cache
    this.cache.set(key, result, ttl);
    
    return result;
  }

  // Optimiser les requêtes de file d'attente
  async getOptimizedQueueStats(serviceId) {
    const cacheKey = `queue_stats_${serviceId}`;
    
    return this.cachedQuery(cacheKey, 10, async () => {
      const query = `
        SELECT 
          COUNT(*) as total_waiting,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())) as avg_wait_time,
          SUM(CASE WHEN is_vip = 1 THEN 1 ELSE 0 END) as vip_count,
          SUM(CASE WHEN is_priority = 1 THEN 1 ELSE 0 END) as priority_count
        FROM tickets 
        WHERE service_id = ? 
          AND status = 'waiting'
          AND created_at > DATE_SUB(NOW(), INTERVAL 4 HOUR)
      `;

      const [results] = await sequelize.query(query, {
        replacements: [serviceId],
        type: sequelize.QueryTypes.SELECT
      });

      return results;
    });
  }

  // Pagination optimisée
  async paginatedQuery(model, options, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const cacheKey = `paginated_${model.name}_${JSON.stringify(options)}_${page}_${limit}`;

    return this.cachedQuery(cacheKey, 15, async () => {
      const { count, rows } = await model.findAndCountAll({
        ...options,
        limit,
        offset,
        distinct: true
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          hasNextPage: (page * limit) < count,
          hasPrevPage: page > 1
        }
      };
    });
  }

  // Monitoring des requêtes lentes
  monitorQuery(query, duration, threshold = 100) {
    if (duration > threshold) {
      const slowQuery = {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration,
        timestamp: new Date().toISOString(),
        threshold
      };

      this.slowQueries.push(slowQuery);
      
      // Garder seulement les 100 dernières
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }

      console.warn(`🐌 Slow query detected: ${duration}ms`, slowQuery.query);
    }
  }

  // Compression de données pour les réponses
  compressData(data) {
    // Pour les grandes listes, on peut compresser
    if (Array.isArray(data) && data.length > 50) {
      return {
        compressed: true,
        count: data.length,
        // Dans un vrai système, on utiliserait gzip ou autre
        // Ici, on retourne juste un summary
        summary: {
          first: data[0],
          last: data[data.length - 1],
          count: data.length
        }
      };
    }
    return data;
  }

  // Nettoyage du cache
  clearCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.del(key);
        }
      });
    } else {
      this.cache.flushAll();
    }
  }

  // Rapport de performance
  getPerformanceReport() {
    return {
      cache: {
        keys: this.cache.keys().length,
        hits: this.cache.getStats().hits,
        misses: this.cache.getStats().misses,
        keysize: this.cache.keys().length
      },
      slowQueries: {
        total: this.slowQueries.length,
        recent: this.slowQueries.slice(-10),
        average: this.slowQueries.reduce((sum, q) => sum + q.duration, 0) / this.slowQueries.length || 0
      }
    };
  }
}

module.exports = new PerformanceOptimizer();