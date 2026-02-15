const request = require('supertest');
const app = require('../src/server'); // Ton VRAI serveur

describe('🎯 TEST SERVEUR RÉEL', () => {
  test('1. Serveur démarre', async () => {
    const response = await request(app).get('/');
    console.log('📦 Serveur réel:', response.body.message);
    expect(response.status).toBe(200);
  });

  test('2. Health check réel', async () => {
    const response = await request(app).get('/health');
    console.log('💓 Health réel:', response.body.status);
    expect(response.status).toBe(200);
  });

  test('3. Services accessibles', async () => {
    const response = await request(app).get('/api/services');
    console.log('🏦 Services:', response.body.count || 0, 'trouvés');
    expect(response.status).toBe(200);
  });

  test('4. Counters accessibles', async () => {
    const response = await request(app).get('/api/counters');
    console.log('🎫 Counters:', response.body.count || 0, 'trouvés');
    expect(response.status).toBe(200);
  });
});
