
const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5000';const
 rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayMenu() {
  console.clear();
  console.log(`
╔══════════════════════════════════════════╗
║    🏦 APPLICATION CONSOLE - TEST API     ║
╚══════════════════════════════════════════╝

1.  📊 Vérifier santé API
2.  📋 Lister tous les services
3.  🏦 Lister tous les comptoirs
4.  🎫 Générer un nouveau ticket
5.  📈 Voir état de la file d'attente
6.  📄 Lister tous les tickets
7.  🔍 Vérifier stockage BDD
8.  🔗 Tester associations Backend-BDD
0.  ❌ Quitter

Votre choix : `);
}

async function checkHealth() {
  try {
    const res = await axios.get(`${API_URL}/health`);
    console.log(`✅ API: ${res.data.status}`);
    console.log(`💾 Base: ${res.data.database}`);
  } catch (e) {
    console.log(`❌ Erreur: ${e.message}`);
  }
}

async function listServices() {
  try {
    const res = await axios.get(`${API_URL}/services`);
    console.log(`📋 ${res.data.count} services:`);
    res.data.services.forEach(s => {
      console.log(`  • ${s.code} - ${s.name} (${s.estimated_time} min)`);
    });
  } catch (e) {
    console.log(`❌ Erreur: ${e.message}`);
  }
}

async function generateTicket() {
  rl.question('Code service (W/D/A/T/L/C): ', async (code) => {
    rl.question('Nom client: ', async (name) => {
      try {
        const res = await axios.post(`${API_URL}/tickets/generate`, {
          serviceCode: code,
          customerName: name
        });
        console.log(`✅ Ticket généré: ${res.data.data.ticket_number}`);
        console.log(`📝 Message: ${res.data.data.message}`);
      } catch (e) {
        console.log(`❌ Erreur: ${e.response?.data?.error || e.message}`);
      }
      promptAction();
    });
  });
}

function promptAction() {
  rl.question('\nAppuyez sur Entrée pour continuer...', () => {
    main();
  });
}

async function main() {
  displayMenu();
  
  rl.question('', async (choice) => {
    switch(choice) {
      case '1': await checkHealth(); break;
      case '2': await listServices(); break;
      case '3': 
        const res = await axios.get(`${API_URL}/counters`);
        console.log(`🏦 ${res.data.count} comptoirs:`);
        res.data.counters.forEach(c => {
          console.log(`  • Comptoir ${c.number}: ${c.status} - Services: ${c.services.join(',')}`);
        });
        break;
      case '4': await generateTicket(); return;
      case '5': 
        const queue = await axios.get(`${API_URL}/tickets/queue`);
        console.log(`📈 File d'attente: ${queue.data.data.total_waiting} ticket(s)`);
        break;
      case '6':
        const tickets = await axios.get(`${API_URL}/tickets`);
        console.log(`📄 ${tickets.data.count} tickets:`);
        tickets.data.tickets.slice(0, 5).forEach(t => {
          console.log(`  • ${t.ticket_number} - ${t.customer_name} - ${t.status}`);
        });
        break;
      case '7':
        console.log('💾 Connexion BDD...');
        const { exec } = require('child_process');
        exec('sqlite3 database/bank_queue.db "SELECT COUNT(*) as tickets FROM tickets; SELECT COUNT(*) as users FROM users;"', 
          (err, stdout) => {
            console.log(stdout);
            promptAction();
          });
        return;
      case '8':
        console.log('🔗 Test associations...');
        const { sequelize } = require('./src/config/database');
        sequelize.query(`
          SELECT 
            (SELECT COUNT(*) FROM tickets WHERE service_id IS NOT NULL) as tickets_with_service,
            (SELECT COUNT(*) FROM tickets WHERE client_id IS NOT NULL) as tickets_with_client,
            (SELECT COUNT(*) FROM counters WHERE employee_id IS NOT NULL) as counters_with_employee
        `).then(([results]) => {
          console.log('Associations trouvées:');
          console.log(`  • Tickets avec service: ${results[0].tickets_with_service}`);
          console.log(`  • Tickets avec client: ${results[0].tickets_with_client}`);
          console.log(`  • Comptoirs avec employé: ${results[0].counters_with_employee}`);
          promptAction();
        });
        return;
      case '0': 
        console.log('👋 Au revoir !');
        rl.close();
        process.exit(0);
      default:
        console.log('❌ Choix invalide');
    }
    promptAction();
  });
}

// Démarrer
main();
