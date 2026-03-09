// frontend/src/pages/SupportChat.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SupportChat.css';

const SupportChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I\'m your QONNEXA virtual assistant. How can I help you with your queue management today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const quickActions = [
    'Check my position',
    'Estimated wait time',
    'Cancel ticket',
    'New ticket',
    'Services',
    'Contact'
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, userMessage]);
    setMessage('');

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: 'Thank you for your message. A support agent will assist you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: action,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, userMessage]);

    setTimeout(() => {
      let response = '';
      switch(action) {
        case 'Check my position':
          response = 'Your current position is #18. There are 5 people ahead of you.';
          break;
        case 'Estimated wait time':
          response = 'Estimated wait time is 20 minutes.';
          break;
        case 'Cancel ticket':
          response = 'To cancel your ticket, please visit any branch or call our support.';
          break;
        case 'New ticket':
          response = 'You can create a new ticket from the "Get New Ticket" button.';
          break;
        case 'Services':
          response = 'We offer: Cash Operations, Account Management, Loans, Cards, and more.';
          break;
        case 'Contact':
          response = 'You can reach us at: support@agb.dz or call 1530.';
          break;
        default:
          response = 'How can I help you?';
      }
      
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  return (
    <div className={`support-chat-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar */}
      <nav className="queue-navbar">
        <div className="nav-left">
          <div className="brand-container">
            <span className="nav-logo">AGB</span>
            <span className="nav-brand">QONNEXA</span>
            <span className="nav-slogan">Smart Queue Management System</span>
          </div>
        </div>
        
        <div className="nav-center">
          <span className="datetime">
            {formatDate(currentDateTime)} {formatTime(currentDateTime)}
          </span>
        </div>

        <div className="nav-right">
          <button className="nav-item" onClick={() => handleNavigation('/create-ticket')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>

          <button className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`} onClick={() => handleNavigation('/queue')}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Tracking Queue</span>
          </button>

          <button className={`nav-item ${location.pathname === '/faq' ? 'active' : ''}`} onClick={() => handleNavigation('/faq')}>
            <span className="nav-icon">❓</span>
            <span className="nav-label">FAQ</span>
          </button>

          <button className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`} onClick={() => handleNavigation('/support')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chatbot</span>
          </button>

          <button className="nav-item" onClick={() => handleNavigation('/satisfaction')}>
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Satisfaction</span>
          </button>

          <button className="dark-mode-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/create-ticket')}>
          <span className="mobile-nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button className={`mobile-nav-item ${location.pathname === '/queue' ? 'active' : ''}`} onClick={() => handleNavigation('/queue')}>
          <span className="mobile-nav-icon">📊</span>
          <span>Tracking Queue</span>
        </button>
        <button className={`mobile-nav-item ${location.pathname === '/faq' ? 'active' : ''}`} onClick={() => handleNavigation('/faq')}>
          <span className="mobile-nav-icon">❓</span>
          <span>FAQ</span>
        </button>
        <button className={`mobile-nav-item ${location.pathname === '/support' ? 'active' : ''}`} onClick={() => handleNavigation('/support')}>
          <span className="mobile-nav-icon">💬</span>
          <span>Chatbot</span>
        </button>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/satisfaction')}>
          <span className="mobile-nav-icon">⭐</span>
          <span>Satisfaction</span>
        </button>
      </div>

      {/* Chat Content */}
      <div className="support-chat-container">
        <div className="support-chat-header">
          <h1>QONNEXA Support</h1>
          <p>How can we help you today?</p>
        </div>

        <div className="support-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`support-message ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="support-message-avatar">Q</div>
              )}
              {msg.sender === 'user' && (
                <div className="support-message-avatar">👤</div>
              )}
              <div className="support-message-content">
                <p>{msg.text}</p>
                <span className="support-message-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="support-quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="support-quick-btn"
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </button>
          ))}
        </div>

        <div className="support-chat-input-area">
          <input
            type="text"
            className="support-chat-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-btn" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;