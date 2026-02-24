import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;
  
  const [activeTab, setActiveTab] = useState('tracking');

  // Données simulées
  const queueData = {
    position: ticketData?.position || 18,
    ahead: 5,
    waitTime: 20,
    ticketNumber: ticketData?.number || 'T6457',
    service: ticketData?.service || 'Account Opening',
    currentServing: {
      service: 'Account Opening',
      position: '#1',
      time: '0 min'
    }
  };

  const notifications = [
    {
      id: 1,
      message: 'Your turn is approaching. Only 6 people ahead of you.',
      time: '20:35'
    },
    {
      id: 2,
      message: 'Ticket T2466 generated for Loan Request. Your position: #12',
      time: '19:50'
    },
    {
      id: 3,
      message: 'Thank you for your patience. Please fill out our satisfaction survey',
      time: '19:15'
    },
    {
      id: 4,
      message: 'Ticket T6457 generated for Account Opening. Your position: #5',
      time: '19:15'
    }
  ];

  const faqItems = [
    {
      question: "What documents are required for Gold credit card?",
      answer: "For a Gold credit card, you typically need: valid ID, proof of income, bank statements for the last 3 months, and a good credit history."
    },
    {
      question: "How do I apply for a personal loan?",
      answer: "You can apply for a personal loan by visiting any AGB branch, using our online banking platform, or through the QONNEXEA app."
    },
    {
      question: "How can I check my account balance online?",
      answer: "You can check your account balance through our online banking portal, mobile app, or by visiting any ATM."
    },
    {
      question: "What is mobile deposit?",
      answer: "Mobile deposit allows you to deposit checks using your smartphone camera through our banking app."
    }
  ];

  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <div className="queue-page">
      <Navbar />
      
      <div className="queue-header">
        <div className="header-left">
          <h1 className="queue-main-title">QONNEXEA</h1>
          <p className="queue-subtitle">Smart Queue Management System</p>
        </div>
        <div className="header-right">
          <div className="datetime">
            <span>Thursday, February 24, 2026</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="queue-tabs">
        <button 
          className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          📊 Tracking
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          ❓ FAQ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="tab-content">
        {/* TAB TRACKING */}
        {activeTab === 'tracking' && (
          <div className="tracking-content">
            <h2>Tracking the Queue</h2>
            
            <div className="tracking-card">
              <div className="ticket-info-header">
                <span className="ticket-label">Your ticket:</span>
                <span className="ticket-number-large">{queueData.ticketNumber}</span>
                <span className="ticket-service-badge">{queueData.service}</span>
              </div>

              <div className="position-stats">
                <div className="stat-row">
                  <span className="stat-label">Your position:</span>
                  <span className="stat-value">{queueData.position}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">People ahead of you:</span>
                  <span className="stat-value">{queueData.ahead}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Estimated wait time:</span>
                  <span className="stat-value">{queueData.waitTime} minutes</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (queueData.position / 20) * 100)}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  {queueData.position} of 20 in queue
                </p>
              </div>

              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Position #1</th>
                    <th>Estimated Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{queueData.currentServing.service}</td>
                    <td>{queueData.currentServing.position}</td>
                    <td>{queueData.currentServing.time}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="assistance-section">
              <h3>Need Assistance?</h3>
              <div className="assistance-buttons">
                <button className="assist-btn" onClick={() => setActiveTab('chat')}>
                  💬 Chat with QONNEXEA Support
                </button>
                <button className="assist-btn" onClick={() => setActiveTab('faq')}>
                  ❓ Browse FAQs
                </button>
                <button className="assist-btn" onClick={() => navigate('/create-ticket')}>
                  🎫 Get New Ticket
                </button>
                <button className="assist-btn primary" onClick={() => navigate('/satisfaction')}>
                  ⭐ Rate Your Experience
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="notifications-content">
            <h2>Notifications</h2>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB FAQ */}
        {activeTab === 'faq' && (
          <div className="faq-content">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-search">
              <input 
                type="text" 
                placeholder="Search for a topic or keyword..."
                className="faq-search-input"
              />
            </div>

            <div className="faq-categories">
              <button className="category-btn">Cards</button>
              <button className="category-btn">Loans</button>
              <button className="category-btn">Accounts</button>
              <button className="category-btn">Digital Banking</button>
            </div>

            <div className="faq-list">
              {faqItems.map((item, index) => (
                <div key={index} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="faq-icon">{openFAQ === index ? '−' : '+'}</span>
                  </button>
                  {openFAQ === index && (
                    <div className="faq-answer">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CHAT */}
        {activeTab === 'chat' && (
          <div className="chat-content">
            <h2>QONNEXEA Support</h2>
            <p className="chat-subtitle">How can we help you today?</p>

            <div className="chat-messages">
              <div className="message bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <p>Hello! I'm your QONNEXEA virtual assistant. How can I help you with your queue management today?</p>
                  <span className="message-time">8:30 PM</span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <button className="quick-btn">Check my position</button>
              <button className="quick-btn">Estimated wait time</button>
              <button className="quick-btn">Cancel ticket</button>
              <button className="quick-btn">New ticket</button>
              <button className="quick-btn">Services</button>
              <button className="quick-btn">Contact</button>
            </div>

            <div className="chat-input-area">
              <input 
                type="text" 
                placeholder="Type your message..."
                className="chat-input"
              />
              <button className="send-btn">Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePage;