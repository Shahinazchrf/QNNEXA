const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send ticket confirmation
  async sendTicketConfirmation(email, ticketData) {
    const mailOptions = {
      from: `"Bank Queue System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Queue Ticket Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏦 Bank Queue System</h2>
          <h3 style="color: #27ae60;">Your Ticket is Ready!</h3>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Ticket Details:</h4>
            <p><strong>Ticket Number:</strong> ${ticketData.number}</p>
            <p><strong>Service:</strong> ${ticketData.service}</p>
            <p><strong>Estimated Wait Time:</strong> ${ticketData.estimated_wait} minutes</p>
            <p><strong>Priority:</strong> ${ticketData.priority}</p>
            <p><strong>Generated At:</strong> ${new Date(ticketData.created_at).toLocaleString()}</p>
          </div>
          
          <p>Please proceed to the waiting area. Your ticket will be called when ready.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #7f8c8d;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Ticket confirmation sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return false;
    }
  }

  // Send VIP notification
  async sendVIPNotification(email, vipDetails) {
    const mailOptions = {
      from: `"Bank VIP Service" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'VIP Queue Service Activated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8e44ad;">🌟 VIP Service Activated</h2>
          
          <p>Dear valued client,</p>
          
          <p>Your VIP status has been activated for today's queue service.</p>
          
          <div style="background-color: #f3e5f5; padding: 15px; border-left: 4px solid #8e44ad; margin: 20px 0;">
            <p><strong>VIP Code:</strong> ${vipDetails.code}</p>
            <p><strong>Benefits:</strong> Priority service, Reduced wait time</p>
            <p><strong>Valid Until:</strong> ${new Date(vipDetails.valid_until).toLocaleDateString()}</p>
          </div>
          
          <p>Thank you for being a valued customer!</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('VIP email failed:', error);
      return false;
    }
  }

  // Send survey request
  async sendSurveyRequest(email, ticketData) {
    const surveyLink = `${process.env.FRONTEND_URL}/survey/${ticketData.id}`;
    
    const mailOptions = {
      from: `"Bank Feedback" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'How was your service today?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">📝 Service Feedback</h2>
          
          <p>Dear ${ticketData.customer_name},</p>
          
          <p>Thank you for using our bank services today. We value your feedback!</p>
          
          <div style="background-color: #ebf5fb; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>Ticket:</strong> ${ticketData.number}</p>
            <p><strong>Service:</strong> ${ticketData.service}</p>
            <p><strong>Completed:</strong> ${new Date(ticketData.completed_at).toLocaleString()}</p>
            
            <a href="${surveyLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; 
                      text-decoration: none; border-radius: 4px; margin-top: 15px;">
              Rate Your Experience
            </a>
          </div>
          
          <p>Your feedback helps us improve our services.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Survey email failed:', error);
      return false;
    }
  }

  // Send admin report
  async sendDailyReport(email, reportData) {
    const mailOptions = {
      from: `"Bank Analytics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Daily Queue Report - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">📊 Daily Queue Report</h2>
          <h3 style="color: #7f8c8d;">${new Date().toLocaleDateString()}</h3>
          
          <div style="display: grid; grid-template-columns: repeat(normal, 1fr); gap: 15px; margin: 20px 0;">
            <div style="background-color: #e8f6f3; padding: 15px; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #16a085;">Total Tickets</h4>
              <p style="font-size: 24px; font-weight: bold; color: #16a085;">${reportData.total_tickets}</p>
            </div>
            
            <div style="background-color: #fef9e7; padding: 15px; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #f39c12;">Completed</h4>
              <p style="font-size: 24px; font-weight: bold; color: #f39c12;">${reportData.completed_tickets}</p>
            </div>
            
            <div style="background-color: #f4ecf7; padding: 15px; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #8e44ad;">Avg Wait Time</h4>
              <p style="font-size: 24px; font-weight: bold; color: #8e44ad;">${reportData.avg_wait_time} min</p>
            </div>
            
            <div style="background-color: #ebf5fb; padding: 15px; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #3498db;">Completion Rate</h4>
              <p style="font-size: 24px; font-weight: bold; color: #3498db;">${reportData.completion_rate}%</p>
            </div>
          </div>
          
          <h4>Service Distribution:</h4>
          <ul>
            ${reportData.by_service.map(s => 
              `<li>${s.service}: ${s.count} tickets (${s.percentage})</li>`
            ).join('')}
          </ul>
          
          <p style="font-size: 12px; color: #7f8c8d; margin-top: 30px;">
            Report generated at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Report email failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();