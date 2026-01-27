const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(50));
console.log('BANK QUEUE - CONSOLE MONITOR');
console.log('='.repeat(50));
console.log('Real-time queue monitoring interface');
console.log('Press Ctrl+C to exit');
console.log('='.repeat(50));

function showMenu() {
  console.log('\nOPTIONS:');
  console.log('1. View waiting tickets');
  console.log('2. View counter status');
  console.log('3. View statistics');
  console.log('4. Call next ticket');
  console.log('5. Complete ticket');
  console.log('0. Exit');
  console.log('');
  
  rl.question('Select: ', handleChoice);
}

function handleChoice(choice) {
  switch(choice) {
    case '1':
      console.log('\nWAITING TICKETS:');
      console.log('T001 - Account Opening');
      console.log('T002 - Withdrawal');
      console.log('T003 - Deposit');
      console.log('(Demo data - connect to DB for real data)');
      showMenu();
      break;
      
    case '2':
      console.log('\nCOUNTER STATUS:');
      console.log('Counter 1: Active - Serving T001');
      console.log('Counter 2: Busy - Withdrawal service');
      console.log('Counter 3: Available');
      showMenu();
      break;
      
    case '3':
      console.log('\nSTATISTICS:');
      console.log('Tickets today: 15');
      console.log('Completed: 12');
      console.log('Waiting: 3');
      console.log('Avg wait time: 8 minutes');
      showMenu();
      break;
      
    case '4':
      console.log('\nCalling next ticket...');
      console.log('Ticket T004 called to Counter 3');
      setTimeout(showMenu, 1000);
      break;
      
    case '5':
      console.log('\nCompleting current ticket...');
      console.log('Ticket T001 marked as completed');
      setTimeout(showMenu, 1000);
      break;
      
    case '0':
      console.log('\nExiting console monitor...');
      rl.close();
      break;
      
    default:
      console.log('Invalid choice');
      showMenu();
      break;
  }
}

// Start
showMenu();

// Handle Ctrl+C
rl.on('close', () => {
  console.log('\nConsole monitor stopped.');
  process.exit(0);
});