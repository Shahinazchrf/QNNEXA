const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware d'authentification principal
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Récupérer le token du header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Use: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Vérifier si c'est un token simple pour le développement
    if (token === 'simple-token-for-now') {
      // Mode développement - utiliser un utilisateur test
      const testUser = await User.findOne({
        where: { role: ['employee', 'admin', 'super_admin'] }
      });
      
      if (testUser) {
        req.user = testUser;
        console.log(`🔓 Dev mode: Using user ${testUser.email} (${testUser.role})`);
        return next();
      } else {
        // Si aucun utilisateur dans la base, créer un objet test
        req.user = {
          id: 'dev-user-001',
          email: 'dev@bank.com',
          first_name: 'Development',
          last_name: 'User',
          role: 'employee',
          is_active: true
        };
        console.log('🔓 Dev mode: Using dummy user');
        return next();
      }
    }

    if (token === 'admin-token-123') {
      // Token spécial pour admin en développement
      const adminUser = await User.findOne({
        where: { role: ['admin', 'super_admin'] }
      });
      
      if (adminUser) {
        req.user = adminUser;
        console.log(`🔓 Dev admin mode: Using admin ${adminUser.email}`);
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
        console.log('🔓 Dev mode: Using dummy admin');
        return next();
      }
    }

    // 3. Vérification JWT (pour la production)
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

      // Mettre à jour le dernier login
      await user.update({ last_login: new Date() });

      req.user = user;
      console.log(`🔐 Authenticated: ${user.email} (${user.role})`);
      next();

    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware pour vérifier le rôle employee
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const allowedRoles = ['employee', 'admin', 'super_admin'];
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Employee access required'
    });
  }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const allowedRoles = ['admin', 'super_admin'];
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
};

// Middleware pour vérifier un rôle spécifique
const requireRole = (...roles) => {
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

// Middleware pour vérifier si c'est le propriétaire ou admin
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const resourceId = req.params.userId || req.params.id;
  const isOwner = req.user.id === resourceId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (isOwner || isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
};

module.exports = {
  authMiddleware,
  requireEmployee,
  requireAdmin,
  requireRole,
  requireOwnerOrAdmin,
  auth: authMiddleware  // AJOUTE CETTE LIGNE
};