const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/bank_queue.db',
  logging: false
});

// Define models directly in server
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'client' }
});

const Service = sequelize.define('Service', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  estimated_time: { type: DataTypes.INTEGER, defaultValue: 15 }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    project: "Bank Queue System",
    status: "✅ Simple version working",
    message: "Basic server is running with direct model definitions"
  });
});

app.get('/api/test/models', async (req, res) => {
  try {
    const userCount = await User.count();
    const serviceCount = await Service.count();
    
    res.json({
      success: true,
      message: 'Models working!',
      counts: { users: userCount, services: serviceCount }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Sync and start
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Simple server on http://localhost:${PORT}`);
    console.log(`✅ Test: http://localhost:${PORT}/api/test/models`);
  });
});
