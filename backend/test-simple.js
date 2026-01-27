// 📁 test-simple.js (à la racine)
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 TEST SIMPLE DU SYSTÈME BANQUE');
console.log('='.repeat(50));

async function test() {
  try {
    // 1. Test santé du serveur
    console.log('\n1️⃣  Test santé du serveur...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ Serveur OK: ${health.data.status}`);
    
    // 2. Test page d'accueil
    console.log('\n2️⃣  Test page d\'accueil...');
    const home = await axios.get(BASE_URL);
    console.log(`   ✅ API: ${home.data.message}`);
    
    // 3. Lister les services
    console.log('\n3️⃣  Liste des services...');
    const services = await axios.get(`${BASE_URL}/api/services`);
    console.log(`   ✅ ${services.data.count} services trouvés:`);
    services.data.services.forEach(s => {
      console.log(`      - ${s.code}: ${s.name} (${s.estimated_time} min)`);
    });
    
    // 4. Générer un ticket
    console.log('\n4️⃣  Génération d\'un ticket...');
    const ticket = await axios.post(`${BASE_URL}/api/tickets/generate`, {
      serviceCode: 'W',
      customerName: 'Test Client'
    });
    console.log(`   ✅ Ticket créé: ${ticket.data.ticket.number}`);
    console.log(`      Service: ${ticket.data.ticket.service}`);
    console.log(`      Temps estimé: ${ticket.data.ticket.estimated_wait} min`);
    
    // 5. Voir la file d'attente
    console.log('\n5️⃣  État de la file...');
    const queue = await axios.get(`${BASE_URL}/api/tickets/queue`);
    console.log(`   ✅ ${queue.data.data.total_waiting} tickets en attente`);
    console.log(`      VIP: ${queue.data.data.by_priority.vip}`);
    console.log(`      Normal: ${queue.data.data.by_priority.normal}`);
    
    // 6. Tous les tickets
    console.log('\n6️⃣  Liste de tous les tickets...');
    const allTickets = await axios.get(`${BASE_URL}/api/tickets`);
    console.log(`   ✅ ${allTickets.data.count} tickets au total`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('\n✅ Le système fonctionne correctement.');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Tester l\'authentification');
    console.log('   2. Tester les routes employé');
    console.log('   3. Tester les routes admin');
    
  } catch (error) {
    console.log('\n❌ ERREUR DÉTECTÉE:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('\n🔧 Vérifiez que:');
    console.log('   1. Le serveur est démarré (node server-final.js)');
    console.log('   2. La base de données est initialisée');
    console.log('   3. Vous êtes connecté à internet');
  }
}

test();