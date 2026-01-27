const { Ticket, Counter, Service, User } = require('../models');
const { Op } = require('sequelize');
const readline = require('readline');

class ConsoleMonitor {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.menuOptions = {
      '1': 'View Queue Status',
      '2': 'View Counter Status',
      '3': 'View Statistics',
      '4': 'Call Next Ticket',
      '5': 'Complete Current Ticket',
      '6': 'Refresh',
      '0': 'Exit'
    };
  }
  
  async start() {
    console.clear();
    this.showHeader();
    await this.showDashboard();
    this.showMenu();
    this.setupInput();
  }
  
  showHeader() {
    console.log('='.repeat(60));
    console.log('BANK QUEUE MANAGEMENT SYSTEM - CONSOLE MONITOR');
    console.log('='.repeat(60));
    console.log();
  }
  
  async showDashboard() {
    try {
      const [tickets, counters] = await Promise.all([
        Ticket.findAll({
          include: [{ model: Service, as: 'service' }],
          where: { status: { [Op.in]: ['waiting', 'called', 'serving'] } },
          order: [['createdAt', 'ASC']],
          limit: 10
        }),
        Counter.findAll()
      ]);
      
      const waiting = tickets.filter(t => t.status === 'waiting').length;
      const serving = tickets.filter(t => t.status === 'serving').length;
      
      console.log('REAL-TIME DASHBOARD');
      console.log('─'.repeat(40));
      
      console.log(`Tickets Waiting: ${waiting}`);
      console.log(`Tickets Serving: ${serving}`);
      console.log(`Active Counters: ${counters.filter(c => c.status === 'active' || c.status === 'busy').length}/${counters.length}`);
      
      console.log('\nACTIVE TICKETS:');
      console.log('─'.repeat(60));
      
      if (tickets.length === 0) {
        console.log('No active tickets');
      } else {
        tickets.forEach(ticket => {
          console.log(
            `${ticket.ticket_number} | ${ticket.service?.name || 'Unknown'} | ` +
            `${ticket.status} | Priority: ${ticket.priority}`
          );
        });
      }
      
      console.log('\nCOUNTER STATUS:');
      console.log('─'.repeat(60));
      
      counters.forEach(counter => {
        console.log(
          `Counter ${counter.number} | ${counter.status} | ` +
          `Services: ${counter.services?.length || 0}`
        );
      });
      
    } catch (error) {
      console.log('Error loading dashboard:', error.message);
    }
  }
  
  showMenu() {
    console.log('\nMENU OPTIONS:');
    Object.entries(this.menuOptions).forEach(([key, value]) => {
      console.log(`  ${key}. ${value}`);
    });
    console.log();
  }
  
  setupInput() {
    this.rl.question('Select option: ', async (input) => {
      await this.handleInput(input.trim());
    });
  }
  
  async handleInput(input) {
    switch(input) {
      case '1':
        await this.viewQueueStatus();
        break;
      case '2':
        await this.viewCounterStatus();
        break;
      case '3':
        await this.viewStatistics();
        break;
      case '4':
        await this.callNextTicket();
        break;
      case '5':
        await this.completeTicket();
        break;
      case '6':
        await this.refreshDisplay();
        break;
      case '0':
        console.log('Exiting console monitor...');
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
        this.setupInput();
        break;
    }
  }
  
  async viewQueueStatus() {
    console.clear();
    this.showHeader();
    
    const tickets = await Ticket.findAll({
      where: { status: { [Op.in]: ['waiting', 'called', 'serving'] } },
      include: [{ model: Service, as: 'service' }],
      order: [['createdAt', 'ASC']]
    });
    
    console.log('QUEUE STATUS');
    console.log('─'.repeat(60));
    
    tickets.forEach((ticket, index) => {
      console.log(
        `${index + 1}. ${ticket.ticket_number} - ${ticket.service?.name} | ` +
        `Status: ${ticket.status} | Priority: ${ticket.priority}`
      );
    });
    
    this.showMenu();
    this.setupInput();
  }
  
  async viewCounterStatus() {
    console.clear();
    this.showHeader();
    
    const counters = await Counter.findAll({
      include: [{ model: User, as: 'employee', attributes: ['first_name'] }]
    });
    
    console.log('COUNTER STATUS');
    console.log('─'.repeat(60));
    
    counters.forEach(counter => {
      const employee = counter.employee ? counter.employee.first_name : 'Unassigned';
      console.log(
        `Counter ${counter.number}: ${counter.status} | ` +
        `Employee: ${employee} | Services: ${counter.services?.join(', ') || 'None'}`
      );
    });
    
    this.showMenu();
    this.setupInput();
  }
  
  async callNextTicket() {
    console.log('\nCalling next ticket...');
    
    const nextTicket = await Ticket.findOne({
      where: { status: 'waiting' },
      order: [['createdAt', 'ASC']],
      include: [{ model: Service, as: 'service' }]
    });
    
    if (!nextTicket) {
      console.log('No tickets waiting in queue');
    } else {
      const counter = await Counter.findOne({
        where: { status: 'active' }
      });
      
      if (counter) {
        await nextTicket.update({
          status: 'called',
          counter_id: counter.id,
          called_at: new Date()
        });
        
        await counter.update({
          status: 'busy',
          current_ticket_id: nextTicket.id
        });
        
        console.log(`Ticket ${nextTicket.ticket_number} called to Counter ${counter.number}`);
        console.log(`Service: ${nextTicket.service?.name}`);
        console.log(`Priority: ${nextTicket.priority}`);
      } else {
        console.log('No available counters');
      }
    }
    
    setTimeout(() => {
      this.setupInput();
    }, 2000);
  }
  
  async completeTicket() {
    console.log('\nCompleting current ticket...');
    
    const currentTicket = await Ticket.findOne({
      where: { status: 'serving' },
      include: [
        { model: Counter, as: 'counter' },
        { model: Service, as: 'service' }
      ]
    });
    
    if (!currentTicket) {
      console.log('No ticket currently being served');
    } else {
      await currentTicket.update({
        status: 'completed',
        completed_at: new Date()
      });
      
      if (currentTicket.counter) {
        await currentTicket.counter.update({
          status: 'active',
          current_ticket_id: null
        });
      }
      
      console.log(`Ticket ${currentTicket.ticket_number} completed`);
      console.log(`Service: ${currentTicket.service?.name}`);
    }
    
    setTimeout(() => {
      this.setupInput();
    }, 2000);
  }
  
  async viewStatistics() {
    console.clear();
    this.showHeader();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalTickets, ticketsToday, completedToday] = await Promise.all([
      Ticket.count(),
      Ticket.count({ where: { createdAt: { [Op.gte]: today } } }),
      Ticket.count({ where: { status: 'completed', createdAt: { [Op.gte]: today } } })
    ]);
    
    console.log('SYSTEM STATISTICS');
    console.log('─'.repeat(40));
    
    console.log(`Total Tickets: ${totalTickets}`);
    console.log(`Tickets Today: ${ticketsToday}`);
    console.log(`Completed Today: ${completedToday}`);
    
    if (ticketsToday > 0) {
      const rate = (completedToday / ticketsToday * 100).toFixed(1);
      console.log(`Completion Rate: ${rate}%`);
    }
    
    this.showMenu();
    this.setupInput();
  }
  
  async refreshDisplay() {
    console.clear();
    await this.start();
  }
}

// Start if run directly
if (require.main === module) {
  const monitor = new ConsoleMonitor();
  monitor.start();
} else {
  module.exports = ConsoleMonitor;
}