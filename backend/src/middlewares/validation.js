const { body, param, query, validationResult } = require('express-validator');
const { Service, User, Counter } = require('../models');

// Common validators
const commonValidators = {
  email: body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  name: body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name too long'),

  phone: body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{10,20}$/)
    .withMessage('Invalid phone number')
};

// Ticket validation
const ticketValidation = [
  body('serviceCode')
    .notEmpty()
    .withMessage('Service code is required')
    .isUppercase()
    .withMessage('Service code must be uppercase')
    .custom(async (code) => {
      const service = await Service.findOne({ where: { code, is_active: true } });
      if (!service) {
        throw new Error('Service not available');
      }
      return true;
    }),

  body('customerName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Customer name too long'),

  body('vipCode')
    .optional()
    .isLength({ max: 20 })
    .withMessage('VIP code too long')
];

// User validation
const userValidation = {
  register: [
    commonValidators.email,
    commonValidators.password,
    commonValidators.name,
    body('last_name')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 50 })
      .withMessage('Last name too long'),
    
    body('role')
      .optional()
      .isIn(['client', 'employee', 'admin', 'super_admin'])
      .withMessage('Invalid role'),

    body('phone')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Phone number too long')
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid user ID'),

    body('first_name')
      .optional()
      .isLength({ max: 50 })
      .withMessage('First name too long'),

    body('last_name')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Last name too long'),

    body('role')
      .optional()
      .isIn(['client', 'employee', 'admin', 'super_admin'])
      .withMessage('Invalid role'),

    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be boolean')
  ]
};

// Counter validation
const counterValidation = {
  create: [
    body('number')
      .notEmpty()
      .withMessage('Counter number is required')
      .isInt({ min: 1 })
      .withMessage('Counter number must be positive integer')
      .custom(async (number) => {
        const counter = await Counter.findOne({ where: { number } });
        if (counter) {
          throw new Error(`Counter number ${number} already exists`);
        }
        return true;
      }),

    body('name')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Counter name too long'),

    body('services')
      .optional()
      .isArray()
      .withMessage('Services must be an array'),

    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location too long')
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid counter ID'),

    body('number')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Counter number must be positive integer'),

    body('status')
      .optional()
      .isIn(['active', 'inactive', 'busy', 'break', 'closed'])
      .withMessage('Invalid status')
  ]
};

// Service validation
const serviceValidation = {
  create: [
    body('code')
      .notEmpty()
      .withMessage('Service code is required')
      .isUppercase()
      .withMessage('Service code must be uppercase')
      .isLength({ max: 10 })
      .withMessage('Service code too long')
      .custom(async (code) => {
        const service = await Service.findOne({ where: { code } });
        if (service) {
          throw new Error(`Service code ${code} already exists`);
        }
        return true;
      }),

    body('name')
      .notEmpty()
      .withMessage('Service name is required')
      .isLength({ max: 100 })
      .withMessage('Service name too long'),

    body('estimated_time')
      .optional()
      .isInt({ min: 1, max: 240 })
      .withMessage('Estimated time must be between 1 and 240 minutes'),

    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description too long')
  ]
};

// Query parameter validation
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be positive integer')
      .toInt(),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid date')
      .toDate(),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be valid date')
      .toDate()
  ]
};

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

module.exports = {
  commonValidators,
  ticketValidation,
  userValidation,
  counterValidation,
  serviceValidation,
  queryValidation,
  validate
};