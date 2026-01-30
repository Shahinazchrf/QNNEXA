const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CLIENT: 'client'
};

// Middleware to check specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
  };
};

// Specific role middlewares
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);
const requireAdmin = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);
const requireEmployee = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE);
const requireClient = requireRole(ROLES.CLIENT);

// Check if user can access resource (owner or admin)
const requireOwnerOrAdmin = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isOwner = req.user.id === req.params.userId || 
                   req.user.id === req.body.userId ||
                   req.user.id === req[resourceUserIdField];

    if (isSuperAdmin || isAdmin || isOwner) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied. You must be the owner or an admin'
      });
    }
  };
};

// Check permissions for ticket operations
const ticketPermissions = {
  canView: (user, ticket) => {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
    if (user.role === ROLES.EMPLOYEE && ticket.counter_id === user.counter_id) return true;
    if (user.role === ROLES.CLIENT && ticket.client_id === user.id) return true;
    return false;
  },

  canUpdate: (user, ticket) => {
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
    if (user.role === ROLES.EMPLOYEE && ticket.counter_id === user.counter_id) return true;
    return false;
  },

  canDelete: (user) => {
    return user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN;
  }
};

module.exports = {
  ROLES,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireEmployee,
  requireClient,
  requireOwnerOrAdmin,
  ticketPermissions
};