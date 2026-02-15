// middleware/performance.js
const responseTime = require('response-time');

const performanceMonitor = responseTime((req, res, time) => {
  if (time > 1000) { // Plus d'1 seconde
    console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${time}ms`);
    
    // Loguer les détails pour analyse
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      duration: time,
      user: req.user?.id,
      query: req.query,
      bodySize: req.headers['content-length']
    });
  }
});

// Middleware pour logger les requêtes lentes
const slowQueryDetector = (threshold = 100) => {
  return async (req, res, next) => {
    const start = Date.now();
    
    // Attacher un listener à la fin de la réponse
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        console.warn(`🐌 Slow query detected: ${req.method} ${req.path} - ${duration}ms`);
        
        // Optionnel: envoyer une alerte
        if (duration > 1000) {
          sendAlert({
            type: 'SLOW_QUERY',
            severity: 'high',
            details: {
              endpoint: `${req.method} ${req.path}`,
              duration,
              user: req.user?.id,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    });
    
    next();
  };
};

module.exports = {
  performanceMonitor,
  slowQueryDetector
};