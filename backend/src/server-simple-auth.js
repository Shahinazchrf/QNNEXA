const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Connected to SQLite database'))
  .catch(err => console.log('❌ Database connection error:', err.message));

// ==================== SIMPLE AUTH ROUTES ====================

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Simple register (no password hashing for now)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { User } = require('./models');
    const { email, password, first_name, last_name } = req.body;
    
    const user = await User.create({
      email,
      password, // Note: In production, hash this!
      first_name,
      last_name,
      role: 'client'
    });
    
    res.json({
      success: true,
      message: 'User registered (simple version)',
      user: { id: user.id, email: user.email, name: user.first_name }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { User } = require('./models');
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    res.json({
      success: true,
      message: 'Login successful (simple version)',
      user: { id: user.id, email: user.email, role: user.role },
      token: 'simple-token-for-now' // Simple token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🏦 BANK QUEUE SYSTEM - SIMPLE AUTH VERSION');
  console.log('='.repeat(60));
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`✅ Test: http://localhost:${PORT}/api/test`);
  console.log(`✅ Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`✅ Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log('='.repeat(60));
});
