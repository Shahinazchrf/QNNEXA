// frontend/src/pages/QueuePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket || {
    number: 'T6457',
    service: 'Account Opening',
    position: 18,
    waitTime: 20
  };
  
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const queueData = {
    position: ticketData?.position || 18,
    ahead: ticketData ? ticketData.position - 1 : 17,
    waitTime: ticketData?.waitTime || 20,
    ticketNumber: ticketData?.number || 'T6457',
    service: ticketData?.service || 'Account Opening'
  };

  const notifications = [
    {
      id: 1,
      message: 'Your turn is approaching. Only 6 people ahead of you.'
    },
    {
      id: 2,
      message: 'Ticket T2466 generated for Loan Request. Your position: #12'
    },
    {
      id: 3,
      message: 'Thank you for your patience. Please fill out our satisfaction survey.'
    },
    {
      id: 4,
      message: 'Ticket T6457 generated for Account Opening. Your position: #5'
    }
  ];

  const faqItems = [
    {
      question: "What documents are required for Gold credit card?"
    },
    {
      question: "How do apply Ina personal loan?"
    },
    {
      question: "How can I check my account balance online?"
    },
    {
      question: "What is mobile deposit?"
    }
  ];

  return (
    <div className={`queue-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar with Queue button */}
      <nav className="queue-navbar">
        <div className="nav-left">
          <span className="nav-logo" onClick={() => navigate('/')}>AGB</span>
          <span className="nav-slogan">Smart Queue Management System</span>
        </div>
        
        <div className="nav-center">
          <span className="datetime">
            {formatDate(currentDateTime)} {formatTime(currentDateTime)}
          </span>
        </div>

        <div className="nav-right">
          <button 
            className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`}
            onClick={() => navigate('/queue')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Queue</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`}
            onClick={() => navigate('/satisfaction')}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Feedback</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/faq' ? 'active' : ''}`}
            onClick={() => navigate('/faq')}
          >
            <span className="nav-icon">❓</span>
            <span className="nav-label">FAQ</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}
            onClick={() => navigate('/support')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chatbot</span>
          </button>
          <button 
            className="dark-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Queue Content */}
      <div className="queue-container">
        <h1 className="main-title">Tracking the Queue</h1>
        
        <div className="tracking-list">
          <div className="tracking-item">
            <span className="tracking-label">Your position:</span>
            <span className="tracking-value">{queueData.position}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">People ahead of you:</span>
            <span className="tracking-value">{queueData.ahead}</span>
          </div>
          <div className="tracking-item">
            <span className="tracking-label">Estimated wait time:</span>
            <span className="tracking-value">{queueData.waitTime} minutes</span>
          </div>
        </div>

        <div className="ticket-info">
          <div className="ticket-number">{queueData.ticketNumber}</div>
          <p className="ticket-message">Please wait for your number to be called</p>
        </div>

        <table className="service-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Position #1 Estimated Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="service-name">Account Opening #1</td>
              <td className="service-time">0 min</td>
            </tr>
          </tbody>
        </table>

        <div className="notifications-section">
          <h2 className="section-title">Notifications</h2>
          <div className="notifications-list">
            {notifications.map((notif, index) => (
              <div key={index} className="notification-item">
                <span className="notification-bullet">•</span>
                <span className="notification-message">{notif.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <span className="faq-question">{item.question}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;