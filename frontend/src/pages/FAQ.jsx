// frontend/src/pages/FAQ.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});

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

  const faqItems = [
    {
      id: 1,
      question: "What documents be required for Gold credit card?",
      answer: "For a Gold credit card, you typically need: valid ID (passport or national ID), proof of income (salary slips or tax returns), bank statements for the last 3 months, and a good credit history."
    },
    {
      id: 2,
      question: "How Do apply Ina personal loan?",
      answer: "You can apply for a personal loan by visiting any AGB branch, using our online banking platform, or through the QONNEXEA app. Required documents include ID, proof of income, and bank statements."
    },
    {
      id: 3,
      question: "How can it a check my account balance online?",
      answer: "You can check your account balance through our online banking portal, mobile app, or by visiting any ATM. Simply log in to your account and your balance will be displayed on the dashboard."
    },
    {
      id: 4,
      question: "What is mobile deposit?",
      answer: "Mobile deposit allows you to deposit checks using your smartphone camera through our banking app. Simply endorse the check, take photos of both sides, and submit. The funds are typically available within 1-2 business days."
    }
  ];

  const toggleItem = (id) => {
    setOpenItems({
      ...openItems,
      [id]: !openItems[id]
    });
  };

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`faq-page ${darkMode ? 'dark' : ''}`}>
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

          <button className="nav-item" onClick={() => handleNavigation('/support')}>
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
        <button className="mobile-nav-item" onClick={() => handleNavigation('/support')}>
          <span className="mobile-nav-icon">💬</span>
          <span>Chatbot</span>
        </button>
        <button className="mobile-nav-item" onClick={() => handleNavigation('/satisfaction')}>
          <span className="mobile-nav-icon">⭐</span>
          <span>Satisfaction</span>
        </button>
      </div>

      {/* FAQ Content */}
      <div className="faq-container">
        <div className="faq-header">
          <h1 className="faq-main-title">Frequently Asked Questions</h1>
        </div>
        
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
            {filteredFaq.length === 0 ? (
              <p className="no-results">No questions found matching your search.</p>
            ) : (
              filteredFaq.map((item) => (
                <div key={item.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => toggleItem(item.id)}
                  >
                    <span>{item.question}</span>
                    <span className="faq-icon">{openItems[item.id] ? '−' : '+'}</span>
                  </button>
                  {openItems[item.id] && (
                    <div className="faq-answer">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;