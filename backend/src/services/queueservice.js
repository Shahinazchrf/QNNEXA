const { Ticket, Service, Counter } = require('../models');
const { Op } = require('sequelize');

class QueueService {
    // Generate ticket without auth
    async generateTicket(serviceCode, customerName = 'Customer', vipCode = null) {
        try {
            // FIXED: use 'name' instead of 'code' (already correct here)
            const service = await Service.findOne({ where: { name: serviceCode } });
            if (!service) {
                return { success: false, error: 'Service not found' };
            }

            // VIP validation
            const isVip = vipCode ? await this.validateVipCode(vipCode) : false;
            const priority = isVip ? 'vip' : 'normal';

            // Generate number
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // FIXED: Changed serviceId to service_id
            const lastTicket = await Ticket.findOne({
                where: {
                    service_id: service.id, // was serviceId
                    createdAt: { [Op.gte]: today }
                },
                order: [['createdAt', 'DESC']]
            });

            let seq = 1; // was 'normal' (which is undefined)
            if (lastTicket && lastTicket.ticket_number) { // was ticketNumber
                const match = lastTicket.ticket_number.match(/\d+/); // was ticketNumber
                if (match) seq = parseInt(match[0]) + 1; // was 'normal'
            }

            const ticketNumber = `${serviceCode}${seq.toString().padStart(3, '0')}`; // was 'normal'

            // Calculate wait time
            const waitTime = await this.calculateWaitTime(service.id, priority);

            // Create ticket - FIXED: use correct field names
            const ticket = await Ticket.create({
                ticket_number: ticketNumber, // was ticketNumber
                service_id: service.id, // was serviceId
                priority,
                status: 'waiting',
                customer_name: customerName, // was customerName
                vip_code_used: isVip ? vipCode : null, // was vipCode
                estimated_wait_time: waitTime, // was estimatedWait
                is_vip: isVip // ADDED: need to set is_vip
            });

            // Socket notification
            this.notify('ticket_created', ticket);

            return {
                success: true,
                ticket: {
                    number: ticket.ticket_number, // was ticketNumber
                    service: service.name,
                    priority,
                    estimatedWait: waitTime,
                    createdAt: ticket.createdAt
                }
            };

        } catch (error) {
            console.error('QueueService error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get next ticket
    async getNextTicket(counterId) {
        try {
            // Look for VIP first
            let ticket = await Ticket.findOne({
                where: { status: 'waiting', priority: 'vip' },
                include: [{ model: Service, as: 'ticketService' }], // FIXED: added alias
                order: [['createdAt', 'ASC']]
            });

            if (!ticket) {
                ticket = await Ticket.findOne({
                    where: { status: 'waiting', priority: 'normal' },
                    include: [{ model: Service, as: 'ticketService' }], // FIXED: added alias
                    order: [['createdAt', 'ASC']]
                });
            }

            if (!ticket) return null;

            // Assign to counter - FIXED: use correct field names
            await ticket.update({
                status: 'called',
                counter_id: counterId, // was counterId
                called_at: new Date() // was calledAt
            });

            // Update counter - FIXED: use correct field names
            const counter = await Counter.findByPk(counterId);
            if (counter) {
                await counter.update({ 
                    current_ticket_id: ticket.id, // was currentTicketId
                    status: 'busy' // ADDED: set counter status
                });
            }

            this.notify('ticket_called', ticket);
            return ticket;

        } catch (error) {
            throw error;
        }
    }

    // Calculate wait time
    async calculateWaitTime(serviceId, priority) {
        // FIXED: use service_id instead of serviceId
        const waitingCount = await Ticket.count({
            where: { service_id: serviceId, status: 'waiting', priority: 'normal' } // was serviceId
        });

        const service = await Service.findByPk(serviceId);
        const baseTime = service?.estimated_time || 15; // was estimatedTime

        let waitTime = waitingCount * baseTime;
        if (priority === 'vip') waitTime = Math.max(5, waitTime / 2); // was 'vip' and 'normal'

        return Math.ceil(waitTime);
    }

    // Validate VIP code
    async validateVipCode(code) {
        if (!code) return false;
        const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM', 'VIP2024'];
        return validCodes.includes(code.toUpperCase());
    }

    // Get queue status
    async getQueueStatus(serviceCode = null) {
        const where = { status: 'waiting' };
        
        if (serviceCode) {
            // FIXED: use 'name' instead of 'code' (already correct here)
            const service = await Service.findOne({ where: { name: serviceCode } });
            if (service) where.service_id = service.id; // was serviceId
        }

        const tickets = await Ticket.findAll({
            where,
            include: [{ model: Service, as: 'ticketService' }], // FIXED: added alias
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
        });

        return {
            total: tickets.length,
            vip: tickets.filter(t => t.priority === 'vip').length,
            normal: tickets.filter(t => t.priority === 'normal').length,
            tickets: tickets.slice(0, 10).map(t => ({
                number: t.ticket_number, // was ticketNumber
                service: t.ticketService?.name, // was t.Service.name
                priority: t.priority,
                customerName: t.customer_name, // was customerName
                waitingSince: t.createdAt,
                estimatedWait: t.estimated_wait_time // was estimatedWait
            }))
        };
    }

    // Mark ticket as serving
    async serveTicket(ticketId) {
        const ticket = await Ticket.findByPk(ticketId);
        // FIXED: use correct field names
        await ticket.update({ 
            status: 'serving', 
            serving_started_at: new Date() // was startedAt
        });
        this.notify('ticket_serving', ticket);
    }

    // Mark ticket as completed
    async completeTicket(ticketId) {
        const ticket = await Ticket.findByPk(ticketId);
        // FIXED: use correct field names
        await ticket.update({ 
            status: 'completed', 
            completed_at: new Date() // was completedAt
        });

        // FIXED: use correct field names
        const counter = await Counter.findOne({ where: { current_ticket_id: ticketId } }); // was currentTicketId
        if (counter) await counter.update({ 
            current_ticket_id: null, // was currentTicketId
            status: 'active' // ADDED: set counter status
        });

        this.notify('ticket_completed', ticket);
    }

    // Notifications
    notify(event, data) {
        if (global.io) {
            global.io.emit(event, data);
        }
    }
}

module.exports = new QueueService();