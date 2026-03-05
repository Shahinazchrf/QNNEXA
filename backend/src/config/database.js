const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'bank_queue_pfe',
  'pfe_user',
  'pfe_password123',
 {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    timezone: '+01:00'  // Force Algeria time
  }
);

module.exports = { sequelize };
