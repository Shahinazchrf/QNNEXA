const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // For testing - allow special tokens
    if (token === 'simple-token-for-now') {
      const testUser = await User.findOne({
        where: { role: ['employee', 'admin', 'super_admin'] }
      });
      
      if (testUser) {
        req.user = testUser;
        return next();
      } else {
        req.user = {
          id: 'dev-user-001',
          email: 'dev@bank.com',
          first_name: 'Development',
          last_name: 'User',
          role: 'employee',
          is_active: true
        };
        return next();
      }
    }

    if (token === 'admin-token-123') {
      const adminUser = await User.findOne({
        where: { role: ['admin', 'super_admin'] }
      });
      
      if (adminUser) {
        req.user = adminUser;
        return next();
      } else {
        req.user = {
          id: 'dev-admin-001',
          email: 'admin@bank.com',
          first_name: 'Admin',
          last_name: 'Dev',
          role: 'admin',
          is_active: true
        };
        return next();
      }
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bank-queue-dev-secret-2024');
      
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      req.user = user;
      next();

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

authMiddleware.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Required role: ${roles.join(' or ')}`
      });
    }
  };
};

module.exports = authMiddleware;