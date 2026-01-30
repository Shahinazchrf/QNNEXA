const { ValidationError, DatabaseError, UniqueConstraintError } = require('sequelize');

const erroHandler = (err, req, res, next) => {
  console.error('🚨 Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Sequelize Validation Error
  if (err instanceof ValidationError) {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  // Sequelize Unique Constraint Error
  if (err instanceof UniqueConstraintError) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: `${err.errors[0].path} already exists`
    });
  }

  // Sequelize Database Error
  if (err instanceof DatabaseError) {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred'
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired'
    });
  }

  // Custom Error with status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = handleError;