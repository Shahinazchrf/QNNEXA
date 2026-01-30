const { Ticket, User } = require('../models');
const { Op } = require('sequelize');

class VIPService {
  // Validate VIP code
  async validateCode(code) {
    if (!code) return { valid: false, message: 'VIP code required' };

    // Check format
    const vipRegex = /^VIP[A-Z0-9]{3,10}$/;
    if (!vipRegex.test(code.toUpperCase())) {
      return { valid: false, message: 'Invalid VIP code format' };
    }

    // In real app, check against database
    const validCodes = [
      { code: 'VIP001', type: 'gold', valid_until: '2024-12-31' },
      { code: 'VIP002', type: 'gold', valid_until: '2024-12-31' },
      { code: 'VIPGOLD', type: 'gold', valid_until: '2024-12-31' },
      { code: 'VIPPLATINUM', type: 'platinum', valid_until: '2024-12-31' },
      { code: 'VIP2024', type: 'special', valid_until: '2024-12-31' }
    ];

    const vipCode = validCodes.find(vc => vc.code === code.toUpperCase());
    
    if (!vipCode) {
      return { valid: false, message: 'Invalid VIP code' };
    }

    // Check expiry
    const today = new Date();
    const expiryDate = new Date(vipCode.valid_until);
    
    if (today > expiryDate) {
      return { valid: false, message: 'VIP code has expired' };
    }

    // Check usage limit (max 5 uses per day)
    const usageToday = await Ticket.count({
      where: {
        vip_code: code.toUpperCase(),
        createdAt: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
      }
    });

    if (usageToday >= 5) {
      return { valid: false, message: 'Daily usage limit reached for this VIP code' };
    }

    return {
      valid: true,
      code: vipCode.code,
      type: vipCode.type,
      benefits: this.getBenefits(vipCode.type)
    };
  }

  // Get benefits based on VIP type
  getBenefits(type) {
    const benefits = {
      gold: {
        priority: 'vip',
        wait_time_multiplier: 0.5,
        max_wait_time: 10,
        can_transfer: true,
        notifications: true
      },
      platinum: {
        priority: 'vip',
        wait_time_multiplier: 0.3,
        max_wait_time: 5,
        can_transfer: true,
        notifications: true,
        dedicated_counter: true
      },
      special: {
        priority: 'vip',
        wait_time_multiplier: 0.4,
        max_wait_time: 8,
        can_transfer: false,
        notifications: true
      }
    };

    return benefits[type] || benefits.gold;
  }

  // Apply VIP benefits to ticket
  async applyVIPBenefits(ticketId, vipCode) {
    const validation = await this.validateCode(vipCode);
    
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const benefits = validation.benefits;

    // Update ticket with VIP benefits
    await ticket.update({
      priority: benefits.priority,
      is_vip: true,
      vip_code: validation.code,
      vip_type: validation.type,
      estimated_wait_time: Math.min(
        ticket.estimated_wait_time * benefits.wait_time_multiplier,
        benefits.max_wait_time
      )
    });

    // Log VIP usage
    await this.logVIPUsage(validation.code, ticketId, validation.type);

    return {
      success: true,
      ticket: {
        id: ticket.id,
        number: ticket.ticket_number,
        priority: ticket.priority,
        vip_code: validation.code,
        vip_type: validation.type,
        estimated_wait: ticket.estimated_wait_time,
        benefits: benefits
      }
    };
  }

  // Log VIP code usage
  async logVIPUsage(vipCode, ticketId, vipType) {
    // In real app, create a VIPUsage model
    console.log(`VIP Usage: ${vipCode} used for ticket ${ticketId} (${vipType})`);
    
    // You could create a VIPUsage table:
    /*
    await VIPUsage.create({
      vip_code: vipCode,
      ticket_id: ticketId,
      used_at: new Date(),
      benefits_applied: vipType
    });
    */
  }

  // Get VIP statistics
  async getVIPStats(startDate, endDate) {
    const vipTickets = await Ticket.findAll({
      where: {
        is_vip: true,
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    });

    if (vipTickets.length === 0) {
      return {
        total_vip_tickets: 0,
        no_data: true
      };
    }

    // Group by VIP code
    const codeUsage = {};
    vipTickets.forEach(ticket => {
      const code = ticket.vip_code || 'unknown';
      if (!codeUsage[code]) {
        codeUsage[code] = { count: 0, types: new Set() };
      }
      codeUsage[code].count++;
      if (ticket.vip_type) {
        codeUsage[code].types.add(ticket.vip_type);
      }
    });

    // Calculate average wait time reduction
    const regularTickets = await Ticket.findAll({
      where: {
        is_vip: false,
        priority: 'normal',
        status: 'completed',
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      limit: 100
    });

    const vipCompleted = vipTickets.filter(t => t.status === 'completed');
    
    const avgRegularWait = regularTickets.length > 0
      ? regularTickets.reduce((sum, t) => sum + (t.actual_wait_time || 0), 0) / regularTickets.length
      : 15;
    
    const avgVIPWait = vipCompleted.length > 0
      ? vipCompleted.reduce((sum, t) => sum + (t.actual_wait_time || 0), 0) / vipCompleted.length
      : 0;

    const waitReduction = avgRegularWait > 0
      ? ((avgRegularWait - avgVIPWait) / avgRegularWait * 100).toFixed(1)
      : 0;

    return {
      total_vip_tickets: vipTickets.length,
      by_code: Object.entries(codeUsage).map(([code, data]) => ({
        code,
        usage_count: data.count,
        types: Array.from(data.types)
      })),
      performance: {
        average_regular_wait: avgRegularWait.toFixed(1),
        average_vip_wait: avgVIPWait.toFixed(1),
        wait_time_reduction: waitReduction + '%',
        vip_satisfaction_rate: await this.calculateVIPSatisfaction(vipCompleted)
      },
      recommendations: this.generateVIPRecommendations(codeUsage, vipTickets.length)
    };
  }

  // Calculate VIP satisfaction (simplified)
  async calculateVIPSatisfaction(vipTickets) {
    if (vipTickets.length === 0) return 'N/A';

    // In real app, check survey ratings for VIP tickets
    const completedWithGoodTime = vipTickets.filter(t => 
      t.actual_wait_time && t.actual_wait_time < 15
    ).length;

    return ((completedWithGoodTime / vipTickets.length) * 100).toFixed(1) + '%';
  }

  // Generate VIP recommendations
  generateVIPRecommendations(codeUsage, totalVIPTickets) {
    const recommendations = [];

    // Check code usage distribution
    const codes = Object.keys(codeUsage);
    if (codes.length === 1 && totalVIPTickets > 10) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        message: 'Only one VIP code being used extensively',
        suggestion: 'Consider distributing multiple VIP codes or rotating them'
      });
    }

    // Check for code sharing (same code used many times)
    Object.entries(codeUsage).forEach(([code, data]) => {
      if (data.count > 20) {
        recommendations.push({
          type: 'usage',
          priority: 'high',
          message: `VIP code ${code} used ${data.count} times`,
          suggestion: 'Investigate potential code sharing or implement usage limits'
        });
      }
    });

    // Suggest new VIP tiers if usage is high
    if (totalVIPTickets > 50) {
      recommendations.push({
        type: 'business',
        priority: 'low',
        message: 'High VIP usage detected',
        suggestion: 'Consider introducing platinum or premium VIP tiers'
      });
    }

    return recommendations;
  }

  // Generate new VIP codes (admin function)
  async generateVIPCodes(count = 5, type = 'gold', validDays = 30) {
    const codes = [];
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    for (let i = 0; i < count; i++) {
      const code = `VIP${type.toUpperCase().substring(0, 3)}${(1000 + i).toString().substring(1)}`;
      codes.push({
        code,
        type,
        valid_until: validUntil.toISOString().split('T')[0],
        benefits: this.getBenefits(type)
      });
    }

    return codes;
  }

  // Check VIP eligibility for user
  async checkUserEligibility(userId) {
    const user = await User.findByPk(userId);
    if (!user) return { eligible: false, reason: 'User not found' };

    // Check user's transaction history, account balance, etc.
    // This is simplified - in real app, check against business rules
    
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Check if user has been active
    const userTickets = await Ticket.count({
      where: {
        client_id: userId,
        createdAt: { [Op.gte]: sixMonthsAgo }
      }
    });

    if (userTickets >= 10) {
      return {
        eligible: true,
        tier: 'gold',
        reason: 'Frequent customer (10+ visits in 6 months)',
        benefits: this.getBenefits('gold')
      };
    } else if (userTickets >= 5) {
      return {
        eligible: true,
        tier: 'silver',
        reason: 'Regular customer (5+ visits in 6 months)',
        benefits: this.getBenefits('special') // Silver uses special benefits
      };
    }

    return {
      eligible: false,
      reason: 'Insufficient activity (minimum 5 visits in 6 months required)'
    };
  }
}

module.exports = new VIPService();