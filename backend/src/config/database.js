const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'bank_queue_pfe',
  'pfe_user',
  '22-06-2005ninaz',
  {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    timezone: '+01:00',  // Force le fuseau Algérie
    dialectOptions: {
      useUTC: false, // Ne pas utiliser UTC
      dateStrings: true,
      typeCast: true
    }
  }
);
module.exports = { sequelize };