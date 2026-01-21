const queueService = require('../services/queueservice');

const ticketController = {
    // PUBLIC - Generate ticket
    generateTicket: async (req, res) => {
        try {
            const { serviceCode, customerName, vipCode } = req.body;
            
            if (!serviceCode) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Service code required' 
                });
            }

            const result = await queueService.generateTicket(
                serviceCode, 
                customerName || 'Customer',
                vipCode
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                message: 'Ticket generated',
                data: result.ticket
            });

        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // EMPLOYEE - Get next ticket
    getNextTicket: async (req, res) => {
        try {
            const { counterId } = req.body;
            
            if (!counterId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Counter ID required' 
                });
            }

            const ticket = await queueService.getNextTicket(counterId);

            if (!ticket) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No tickets in queue' 
                });
            }

            res.json({
                success: true,
                data: ticket
            });

        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Mark ticket as serving
    serveTicket: async (req, res) => {
        try {
            const { ticketId } = req.body;
            await queueService.serveTicket(ticketId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Mark ticket as completed
    completeTicket: async (req, res) => {
        try {
            const { ticketId } = req.body;
            await queueService.completeTicket(ticketId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Get queue status
    getQueueStatus: async (req, res) => {
        try {
            const { serviceCode } = req.query;
            const status = await queueService.getQueueStatus(serviceCode);
            res.json({ success: true, data: status });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
};

module.exports = ticketController;