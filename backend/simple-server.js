const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// Simple SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/simple_queue.db',
    logging: false
});

// Simple Ticket model
const Ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticketNumber: { type: DataTypes.STRING, allowNull: false },
    serviceCode: { type: DataTypes.STRING, allowNull: false },
    customerName: { type: DataTypes.STRING, defaultValue: 'Customer' },
    priority: { type: DataTypes.ENUM('normal', 'vip'), defaultValue: 'normal' },
    status: { type: DataTypes.ENUM('waiting', 'called', 'serving', 'completed'), defaultValue: 'waiting' },
    estimatedWait: { type: DataTypes.INTEGER, defaultValue: 15 }
});

// Initialize database
async function initDB() {
    await sequelize.sync({ force: true });
    console.log('✅ Database ready');
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Generate ticket
app.post('/api/tickets/generate', async (req, res) => {
    try {
        const { serviceCode, customerName, vipCode } = req.body;
        
        if (!serviceCode) {
            return res.status(400).json({ error: 'Service code required' });
        }
        
        // Get last ticket number
        const lastTicket = await Ticket.findOne({
            order: [['id', 'DESC']]
        });
        
        let seq = 1;
        if (lastTicket && lastTicket.ticketNumber) {
            const match = lastTicket.ticketNumber.match(/\d+/);
            if (match) seq = parseInt(match[0]) + 1;
        }
        
        const ticketNumber = `${serviceCode}${seq.toString().padStart(3, '0')}`;
        const priority = vipCode ? 'vip' : 'normal';
        
        const ticket = await Ticket.create({
            ticketNumber,
            serviceCode,
            customerName: customerName || 'Customer',
            priority,
            status: 'waiting',
            estimatedWait: 15
        });
        
        res.json({
            success: true,
            ticket: {
                number: ticket.ticketNumber,
                service: serviceCode,
                priority: ticket.priority,
                estimatedWait: ticket.estimatedWait
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get queue status
app.get('/api/tickets/queue', async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            where: { status: 'waiting' },
            order: [
                ['priority', 'DESC'], // VIP first
                ['createdAt', 'ASC']  // Oldest first
            ]
        });
        
        res.json({
            success: true,
            data: {
                total: tickets.length,
                vip: tickets.filter(t => t.priority === 'vip').length,
                normal: tickets.filter(t => t.priority === 'normal').length,
                tickets: tickets.map(t => ({
                    number: t.ticketNumber,
                    service: t.serviceCode,
                    priority: t.priority,
                    customerName: t.customerName,
                    estimatedWait: t.estimatedWait
                }))
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get next ticket (for employee)
app.post('/api/tickets/next', async (req, res) => {
    try {
        // Find VIP first
        let ticket = await Ticket.findOne({
            where: { status: 'waiting', priority: 'vip' },
            order: [['createdAt', 'ASC']]
        });
        
        if (!ticket) {
            ticket = await Ticket.findOne({
                where: { status: 'waiting', priority: 'normal' },
                order: [['createdAt', 'ASC']]
            });
        }
        
        if (!ticket) {
            return res.status(404).json({ error: 'No tickets in queue' });
        }
        
        // Update status
        await ticket.update({ status: 'called' });
        
        res.json({
            success: true,
            ticket: {
                number: ticket.ticketNumber,
                service: ticket.serviceCode,
                priority: ticket.priority,
                customerName: ticket.customerName
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, async () => {
    await initDB();
    console.log(`🚀 Simple Queue Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log('   POST /api/tickets/generate');
    console.log('   GET  /api/tickets/queue');
    console.log('   POST /api/tickets/next');
});
