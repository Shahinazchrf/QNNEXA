// frontend/src/pages/FAQ.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});

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

  const faqItems = [
    {
      question: "What documents are required for Gold credit card?",
      answer: "For a Gold credit card, you typically need: valid ID (passport or national ID), proof of income (salary slips or tax returns), bank statements for the last 3 months, and a good credit history."
    },
    {
      question: "How do apply Ina personal loan?",
      answer: "You can apply for a personal loan by visiting any AGB branch, using our online banking platform, or through the QONNEXEA app. Required documents include ID, proof of income, and bank statements."
    },
    {
      question: "How can I check my account balance online?",
      answer: "You can check your account balance through our online banking portal, mobile app, or by visiting any ATM. Simply log in to your account and your balance will be displayed on the dashboard."
    },
    {
      question: "What is mobile deposit?",
      answer: "Mobile deposit allows you to deposit checks using your smartphone camera through our banking app. Simply endorse the check, take photos of both sides, and submit. The funds are typically available within 1-2 business days."
    }
  ];

  const toggleItem = (index) => {
    setOpenItems({
      ...openItems,
      [index]: !openItems[index]
    });
  };

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`faq-page ${darkMode ? 'dark' : ''}`}>
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

      {/* FAQ Content */}
      <div className="faq-container">
        <h1 className="faq-main-title">Frequently Asked Questions</h1>
        
        <div className="faq-search-section">
          <input
            type="text"
            placeholder="Search for a topic or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search-input"
          />
        </div>

        <div className="faq-content">
          <h2 className="faq-title">FAQ</h2>
          
          <div className="faq-list">
            {filteredFaq.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleItem(index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-icon">{openItems[index] ? '−' : '+'}</span>
                </button>
                {openItems[index] && (
                  <div className="faq-answer">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;