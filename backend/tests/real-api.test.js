const request = require('supertest');

// Test contre ton serveur RÉEL qui tourne sur localhost:5000
const API_URL = 'http://localhost:5000';

describe('🎯 TESTS API RÉELLE', () => {
  test('1. Serveur principal répond', async () => {
    const response = await request(API_URL).get('/');
    console.log('✅ Serveur réel:', response.body.message);
    expect(response.status).toBe(200);
  });

  test('2. Health check réel', async () => {
    const response = await request(API_URL).get('/health');
    console.log('✅ Health réel:', response.body.status);
    expect(response.status).toBe(200);
  });

  test('3. Services accessibles', async () => {
    const response = await request(API_URL).get('/api/services');
    console.log('✅ Services réels:', response.body.count || 0, 'trouvés');
    expect(response.status).toBe(200);
  });

  test('4. Counters accessibles', async () => {
    const response = await request(API_URL).get('/api/counters');
    console.log('✅ Counters réels:', response.body.count || 0, 'trouvés');
    expect(response.status).toBe(200);
  });
});
