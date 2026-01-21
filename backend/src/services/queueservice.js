const { Ticket, Service, Counter } = require('../models');
const { Op } = require('sequelize');

class QueueService {
    // Generate ticket without auth
    async generateTicket(serviceCode, customerName = 'Customer', vipCode = null) {
        try {
            const service = await Service.findOne({ where: { code: serviceCode } });
            if (!service) {
                return { success: false, error: 'Service not found' };
            }

            // VIP validation
            const isVip = vipCode ? await this.validateVipCode(vipCode) : false;
            const priority = isVip ? 'vip' : 'normal';

            // Generate number
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const lastTicket = await Ticket.findOne({
                where: {
                    serviceId: service.id,
                    createdAt: { [Op.gte]: today }
                },
                order: [['createdAt', 'DESC']]
            });

            let seq = 1;
            if (lastTicket && lastTicket.ticketNumber) {
                const match = lastTicket.ticketNumber.match(/\d+/);
                if (match) seq = parseInt(match[0]) + 1;
            }

            const ticketNumber = `${serviceCode}${seq.toString().padStart(3, '0')}`;

            // Calculate wait time
            const waitTime = await this.calculateWaitTime(service.id, priority);

            // Create ticket
            const ticket = await Ticket.create({
                ticketNumber,
                serviceId: service.id,
                priority,
                status: 'waiting',
                customerName,
                vipCode: isVip ? vipCode : null,
                estimatedWait: waitTime
            });

            // Socket notification
            this.notify('ticket_created', ticket);

            return {
                success: true,
                ticket: {
                    number: ticket.ticketNumber,
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
                include: [Service],
                order: [['createdAt', 'ASC']]
            });

            if (!ticket) {
                ticket = await Ticket.findOne({
                    where: { status: 'waiting', priority: 'normal' },
                    include: [Service],
                    order: [['createdAt', 'ASC']]
                });
            }

            if (!ticket) return null;

            // Assign to counter
            await ticket.update({
                status: 'called',
                counterId,
                calledAt: new Date()
            });

            // Update counter
            const counter = await Counter.findByPk(counterId);
            if (counter) {
                await counter.update({ currentTicketId: ticket.id });
            }

            this.notify('ticket_called', ticket);
            return ticket;

        } catch (error) {
            throw error;
        }
    }

    // Calculate wait time
    async calculateWaitTime(serviceId, priority) {
        const waitingCount = await Ticket.count({
            where: { serviceId, status: 'waiting', priority: 'normal' }
        });

        const service = await Service.findByPk(serviceId);
        const baseTime = service?.estimatedTime || 15;

        let waitTime = waitingCount * baseTime;
        if (priority === 'vip') waitTime = Math.max(5, waitTime / 2);

        return waitTime;
    }

    // Validate VIP code
    async validateVipCode(code) {
        if (!code) return false;
        const validCodes = ['VIP001', 'VIP002', 'VIPGOLD', 'VIPPLATINUM'];
        return validCodes.includes(code.toUpperCase());
    }

    // Get queue status
    async getQueueStatus(serviceCode = null) {
        const where = { status: 'waiting' };
        
        if (serviceCode) {
            const service = await Service.findOne({ where: { code: serviceCode } });
            if (service) where.serviceId = service.id;
        }

        const tickets = await Ticket.findAll({
            where,
            include: [Service],
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
        });

        return {
            total: tickets.length,
            vip: tickets.filter(t => t.priority === 'vip').length,
            normal: tickets.filter(t => t.priority === 'normal').length,
            tickets: tickets.slice(0, 10).map(t => ({
                number: t.ticketNumber,
                service: t.Service.name,
                priority: t.priority,
                customerName: t.customerName,
                waitingSince: t.createdAt,
                estimatedWait: t.estimatedWait
            }))
        };
    }

    // Mark ticket as serving
    async serveTicket(ticketId) {
        const ticket = await Ticket.findByPk(ticketId);
        await ticket.update({ status: 'serving', startedAt: new Date() });
        this.notify('ticket_serving', ticket);
    }

    // Mark ticket as completed
    async completeTicket(ticketId) {
        const ticket = await Ticket.findByPk(ticketId);
        await ticket.update({ status: 'completed', completedAt: new Date() });

        const counter = await Counter.findOne({ where: { currentTicketId: ticketId } });
        if (counter) await counter.update({ currentTicketId: null });

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