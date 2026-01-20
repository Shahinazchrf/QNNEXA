const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bank Queue API', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Routes API
app.get('/api/services', async (req, res) => {
  const { Service } = require('./models');
  const services = await Service.findAll();
  res.json({ success: true, services });
});

app.get('/api/counters', async (req, res) => {
  const { Counter } = require('./models');
  const counters = await Counter.findAll();
  res.json({ success: true, counters });
});

app.get('/api/tickets', async (req, res) => {
  const { Ticket } = require('./models');
  const tickets = await Ticket.findAll();
  res.json({ success: true, tickets });
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { Ticket } = require('./models');
    const ticket = await Ticket.create({
      ticket_number: 'T' + Date.now(),
      client_id: '1566a768-15c9-49a7-8054-fa7c36ac078c',
      service_id: 'bc5333c8-e4be-4792-ba6b-f54d975c0c8d', 
      counter_id: '1d6b6efe-bc18-4590-9f93-ddc4936d9d35',
      status: 'pending'
    });
    res.json({ success: true, ticket });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/queues', async (req, res) => {
  const { Ticket } = require('./models');
  const waiting = await Ticket.count({ where: { status: 'pending' } });
  const serving = await Ticket.count({ where: { status: 'serving' } });
  res.json({ success: true, waiting, serving });
});

app.get('/api/stats', async (req, res) => {
  const { Ticket } = require('./models');
  const total = await Ticket.count();
  const waiting = await Ticket.count({ where: { status: 'pending' } });
  const serving = await Ticket.count({ where: { status: 'serving' } });
  res.json({ success: true, total, waiting, serving });
});

// Démarrer
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server: http://localhost:${PORT}`);
    console.log('✅ All endpoints ready!');
  });
});