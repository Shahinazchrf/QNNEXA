// services/concurrencyService.js
const { Sequelize } = require('sequelize');

class ConcurrencyService {
  constructor() {
    this.locks = new Map();
    this.queue = new Map();
  }

  async withLock(resourceId, operation, timeout = 5000) {
    const lockKey = `lock_${resourceId}`;
    
    // Tentative d'acquisition du lock
    const acquired = await this.acquireLock(lockKey, timeout);
    
    if (!acquired) {
      throw new Error(`Could not acquire lock for resource ${resourceId}`);
    }

    try {
      return await operation();
    } finally {
      this.releaseLock(lockKey);
    }
  }

  async acquireLock(lockKey, timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!this.locks.has(lockKey)) {
        this.locks.set(lockKey, {
          owner: process.pid,
          acquiredAt: Date.now()
        });
        return true;
      }
      
      // Attendre un peu avant de réessayer
      await this.sleep(100);
    }
    
    return false;
  }

  releaseLock(lockKey) {
    this.locks.delete(lockKey);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pour les tickets - version optimisée
  async createTicketConcurrent(serviceId, ticketData) {
    return this.withLock(`service_${serviceId}`, async () => {
      // Utiliser une transaction
      const transaction = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
      });

      try {
        // Dernier numéro de ticket dans la transaction
        const lastTicket = await Ticket.findOne({
          where: { serviceId },
          order: [['createdAt', 'DESC']],
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        // Générer nouveau numéro
        const newNumber = this.generateNextNumber(lastTicket);
        
        // Créer le ticket
        const ticket = await Ticket.create({
          ...ticketData,
          ticketNumber: newNumber,
          serviceId
        }, { transaction });

        await transaction.commit();
        return ticket;

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }
}

module.exports = new ConcurrencyService();