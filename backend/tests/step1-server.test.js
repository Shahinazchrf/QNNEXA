const request = require('supertest');

// Crée un serveur Express simple
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'API Bank Queue', status: 'Online' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

describe('🎯 TEST SERVEUR BASIQUE', () => {
  test('1. Route /', async () => {
    const response = await request(app).get('/');
    console.log('✅ / :', response.body.message);
    expect(response.status).toBe(200);
  });

  test('2. Route /health', async () => {
    const response = await request(app).get('/health');
    console.log('✅ /health :', response.body.status);
    expect(response.status).toBe(200);
  });
});
