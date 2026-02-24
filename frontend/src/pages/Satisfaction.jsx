// frontend/src/pages/Satisfaction.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Satisfaction.css';

const Satisfaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [criteria, setCriteria] = useState({
    fastService: false,
    professionalStaff: false,
    helpfulSupport: false,
    cleanAgency: false
  });

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

  const handleCriteriaChange = (e) => {
    setCriteria({
      ...criteria,
      [e.target.name]: e.target.checked
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your feedback!');
    navigate('/queue');
  };

  return (
    <div className={`satisfaction-page ${darkMode ? 'dark' : ''}`}>
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

      {/* Satisfaction Content */}
      <div className="satisfaction-container">
        <h1 className="satisfaction-title">Thank you for visiting!</h1>
        <p className="satisfaction-subtitle">How was your experience today?</p>

        <form onSubmit={handleSubmit} className="satisfaction-form">
          {/* Criteria Checklist */}
          <div className="criteria-section">
            <div className="criteria-grid">
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="fastService"
                  checked={criteria.fastService}
                  onChange={handleCriteriaChange}
                />
                <span>Fast Service</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="professionalStaff"
                  checked={criteria.professionalStaff}
                  onChange={handleCriteriaChange}
                />
                <span>Professional Staff</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="helpfulSupport"
                  checked={criteria.helpfulSupport}
                  onChange={handleCriteriaChange}
                />
                <span>Helpful Support</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="cleanAgency"
                  checked={criteria.cleanAgency}
                  onChange={handleCriteriaChange}
                />
                <span>Clean Agency</span>
              </label>
            </div>
          </div>

          {/* Star Rating */}
          <div className="rating-section">
            <p className="rating-label">Notez votre expérience</p>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <p className="comments-label">Vos commentaires</p>
            <textarea
              className="comments-input"
              placeholder="Share your feedback..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
};

export default Satisfaction;