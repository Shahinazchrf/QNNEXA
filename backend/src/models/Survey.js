// backend/src/models/Survey.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'surveys',
  timestamps: true,           // Keep timestamps enabled
  createdAt: 'createdAt',      // This matches your database column
  updatedAt: false,            // This disables updatedAt completely
  indexes: [
    {
      fields: ['ticket_id']
    },
    {
      fields: ['rating']
    }
  ]
});

module.exports = Survey;