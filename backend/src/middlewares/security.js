// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Différents limiters pour différents endpoints
const limiters = {
  // Global API limiter
  api: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requêtes par IP
    'Too many requests from this IP, please try again later'
  ),

  // Création de tickets
  ticketCreation: createRateLimiter(
    60 * 1000, // 1 minute
    5, // 5 tickets max
    'Too many ticket creations, please wait a moment'
  ),

  // Authentification
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // 10 tentatives de login
    'Too many authentication attempts, please try again later'
  ),

  // API publique
  publicApi: createRateLimiter(
    60 * 1000, // 1 minute
    30, // 30 requêtes
    'Too many public requests, please slow down'
  )
};

// Middleware pour valider les entrées
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Middleware pour prévenir les attaques par injection
const securityHeaders = (req, res, next) => {
  // Headers de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP (Content Security Policy)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );

  next();
};

// Middleware pour logger les activités suspectes
const suspiciousActivityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /<script>/i,
    /DROP TABLE/i,
    /UNION SELECT/i,
    /OR 1=1/i,
    /--/,
    /\/\*.*\*\//,
    /exec\(/i,
    /eval\(/i
  ];

  const checkString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn(`🚨 Suspicious activity detected:`, {
        ip: req.ip,
        method: req.method,
        url: req.url,
        pattern: pattern.toString(),
        user: req.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
      });

      // Log dans la base de données
      AuditLog.create({
        userId: req.user?.id,
        action: 'SUSPICIOUS_ACTIVITY',
        details: {
          ip: req.ip,
          method: req.method,
          url: req.url,
          pattern: pattern.toString(),
          userAgent: req.headers['user-agent']
        }
      });

      break;
    }
  }

  next();
};

module.exports = {
  limiters,
  validateInput,
  securityHeaders,
  suspiciousActivityLogger
};