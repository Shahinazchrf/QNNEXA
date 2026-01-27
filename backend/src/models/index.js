// This file should import all models and define relationships
// If it doesn't exist, create it

const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Ticket = require('./Ticket');
const Service = require('./Service');
const Counter = require('./Counter');
const Notification = require('./Notification');
const Survey = require('./Survey');

// DEFINE RELATIONSHIPS

// User has many Tickets (as client)
User.hasMany(Ticket, {
  foreignKey: 'client_id',
  as: 'client_tickets'
});

// Ticket belongs to User (as client)
Ticket.belongsTo(User, {
  foreignKey: 'client_id',
  as: 'client'
});

// Service has many Tickets
Service.hasMany(Ticket, {
  foreignKey: 'service_id',
  as: 'service_tickets'
});

// Ticket belongs to Service
Ticket.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

// Counter has many Tickets
Counter.hasMany(Ticket, {
  foreignKey: 'counter_id',
  as: 'counter_tickets'
});

// Ticket belongs to Counter
Ticket.belongsTo(Counter, {
  foreignKey: 'counter_id',
  as: 'counter'
});

// Employee (User) is assigned to a Counter
User.hasOne(Counter, {
  foreignKey: 'employee_id',
  as: 'assigned_counter'
});

// Counter belongs to an Employee (User)
Counter.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});

// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Ticket has one Survey
Ticket.hasOne(Survey, {
  foreignKey: 'ticket_id',
  as: 'survey'
});

// Survey belongs to Ticket
Survey.belongsTo(Ticket, {
  foreignKey: 'ticket_id',
  as: 'ticket'
});

// Export all models
module.exports = {
  User,
  Ticket,
  Service,
  Counter,
  Notification,
  Survey,
  sequelize
};