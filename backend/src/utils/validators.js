// utils/validators.js
const Joi = require('joi');

const schemas = {
  createTicket: Joi.object({
    serviceId: Joi.number().integer().positive().required(),
    isVIP: Joi.boolean().default(false),
    appointmentId: Joi.string().optional()
  }),

  createAppointment: Joi.object({
    serviceId: Joi.number().integer().positive().required(),
    scheduledTime: Joi.date().greater('now').required(),
    duration: Joi.number().integer().min(5).max(60).default(15),
    notes: Joi.string().max(500).optional()
  }),

  prioritizeTicket: Joi.object({
    ticketId: Joi.string().required(),
    reason: Joi.string().max(200).optional()
  }),

  reassignTicket: Joi.object({
    ticketId: Joi.string().required(),
    newCounterId: Joi.number().integer().positive().required(),
    reason: Joi.string().max(200).optional()
  }),

  sendNotification: Joi.object({
    ticketId: Joi.string().required(),
    message: Joi.string().max(500).required(),
    type: Joi.string().valid('upcoming_turn', 'missed_turn', 'reminder', 'info').required(),
    channel: Joi.string().valid('in_app', 'sms', 'email').default('in_app')
  })
};

// Middleware de validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema ${schemaName} not found`));
    }

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

module.exports = { schemas, validate };