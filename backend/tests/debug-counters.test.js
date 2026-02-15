const request = require('supertest');
const API_URL = 'http://localhost:5000';

describe('🐛 DEBUG /api/counters', () => {
  test('Voir l\'erreur complète', async () => {
    const response = await request(API_URL).get('/api/counters');
    
    console.log('📊 Status:', response.status);
    console.log('📄 Body:', JSON.stringify(response.body, null, 2));
    console.log('🔍 Headers:', response.headers);
    
    // Accepte 200 (OK) ou 500 (pour debug)
    expect([200, 500]).toContain(response.status);
    
    if (response.status === 500) {
      console.log('❌ Erreur 500 détectée');
      console.log('💡 Message d\'erreur:', response.body.error);
    }
  });
});
