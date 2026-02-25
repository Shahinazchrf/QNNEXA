// frontend/src/pages/Satisfaction.jsx

// frontend/src/pages/Satisfaction.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Satisfaction.css';

const Satisfaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // États pour le formulaire
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [fastService, setFastService] = useState(false);
  const [professionalStaff, setProfessionalStaff] = useState(false);
  const [helpfulSupport, setHelpfulSupport] = useState(false);
  const [cleanAgency, setCleanAgency] = useState(false);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Questions supplémentaires
  const [answers, setAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: ''
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

  const handleAnswerChange = (question, value) => {
    setAnswers({
      ...answers,
      [question]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please give a rating');
      return;
    }

    // Ici vous enverriez les données à l'API
    console.log({
      rating,
      criteria: {
        fastService,
        professionalStaff,
        helpfulSupport,
        cleanAgency
      },
      answers,
      comments
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`satisfaction-page ${darkMode ? 'dark' : ''}`}>
        {/* Navbar avec bouton Tracking Queue */}
        <nav className="queue-navbar">
          <div className="nav-left">
            <span className="nav-logo" onClick={() => navigate('/')}>AGB</span>
            <span className="nav-brand">QONNEXA</span>
            <span className="nav-slogan">Smart Queue Management System</span>
          </div>
          
          <div className="nav-center">
            <span className="datetime">
              {formatDate(currentDateTime)} {formatTime(currentDateTime)}
            </span>
          </div>

          <div className="nav-right">
            <button 
              className={`nav-item ${location.pathname === '/create-ticket' ? 'active' : ''}`}
              onClick={() => navigate('/create-ticket')}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-label">Home</span>
            </button>
            {/* BOUTON TRACKING QUEUE AJOUTÉ */}
            <button 
              className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`}
              onClick={() => navigate('/queue')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Tracking Queue</span>
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
              className={`nav-item ${location.pathname === '/cards' ? 'active' : ''}`}
              onClick={() => navigate('/cards')}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-label">Cards</span>
            </button>
            <button 
              className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`}
              onClick={() => navigate('/satisfaction')}
            >
              <span className="nav-icon">⭐</span>
              <span className="nav-label">Satisfaction</span>
            </button>
            <button 
              className="dark-mode-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>
        
        <div className="satisfaction-container">
          <div className="thank-you-card">
            <div className="thank-you-icon">🎉</div>
            <h2 className="thank-you-title">Thank you for your feedback!</h2>
            <p className="thank-you-message">
              Your response has been recorded and will help us improve our services.
            </p>
            <button 
              className="thank-you-btn"
              onClick={() => navigate('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`satisfaction-page ${darkMode ? 'dark' : ''}`}>
      {/* Navbar avec bouton Tracking Queue */}
      <nav className="queue-navbar">
        <div className="nav-left">
          <span className="nav-logo" onClick={() => navigate('/')}>AGB</span>
          <span className="nav-brand">QONNEXA</span>
          <span className="nav-slogan">Smart Queue Management System</span>
        </div>
        
        <div className="nav-center">
          <span className="datetime">
            {formatDate(currentDateTime)} {formatTime(currentDateTime)}
          </span>
        </div>

        <div className="nav-right">
          <button 
            className={`nav-item ${location.pathname === '/create-ticket' ? 'active' : ''}`}
            onClick={() => navigate('/create-ticket')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          {/* BOUTON TRACKING QUEUE AJOUTÉ */}
          <button 
            className={`nav-item ${location.pathname === '/queue' ? 'active' : ''}`}
            onClick={() => navigate('/queue')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Tracking Queue</span>
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
            className={`nav-item ${location.pathname === '/cards' ? 'active' : ''}`}
            onClick={() => navigate('/cards')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Cards</span>
          </button>
          <button 
            className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`}
            onClick={() => navigate('/satisfaction')}
          >
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Satisfaction</span>
          </button>
          <button 
            className="dark-mode-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Contenu Satisfaction */}
      <div className="satisfaction-container">
        <div className="satisfaction-header">
          <span className="logo">AGB</span>
          <span className="agency">Agency: Algiers Main</span>
        </div>

        <h1 className="satisfaction-title">Thank you for visiting!</h1>
        <p className="satisfaction-subtitle">How was your experience today?</p>

        <form onSubmit={handleSubmit} className="satisfaction-form">
          {/* Critères */}
          <div className="criteria-section">
            <div className="criteria-grid">
              <label className="criteria-item">
                <input
                  type="checkbox"
                  checked={fastService}
                  onChange={(e) => setFastService(e.target.checked)}
                />
                <span className="criteria-icon">⚡</span>
                <span className="criteria-label">Fast Service</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  checked={professionalStaff}
                  onChange={(e) => setProfessionalStaff(e.target.checked)}
                />
                <span className="criteria-icon">👔</span>
                <span className="criteria-label">Professional Staff</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  checked={helpfulSupport}
                  onChange={(e) => setHelpfulSupport(e.target.checked)}
                />
                <span className="criteria-icon">🤝</span>
                <span className="criteria-label">Helpful Support</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  checked={cleanAgency}
                  onChange={(e) => setCleanAgency(e.target.checked)}
                />
                <span className="criteria-icon">🧹</span>
                <span className="criteria-label">Clean Agency</span>
              </label>
            </div>
          </div>

          {/* Questions supplémentaires */}
          <div className="questions-section">
            <h3>Additional Questions</h3>
            
            <div className="question-item">
              <p className="question-text">How would you rate the waiting time?</p>
              <div className="question-options">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="option-label">
                    <input
                      type="radio"
                      name="q1"
                      value={value}
                      onChange={(e) => handleAnswerChange('q1', e.target.value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="question-item">
              <p className="question-text">Was the staff helpful?</p>
              <div className="question-options">
                <label className="option-label">
                  <input
                    type="radio"
                    name="q2"
                    value="yes"
                    onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  />
                  <span>Yes</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q2"
                    value="no"
                    onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  />
                  <span>No</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q2"
                    value="somewhat"
                    onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  />
                  <span>Somewhat</span>
                </label>
              </div>
            </div>

            <div className="question-item">
              <p className="question-text">Was the process clear?</p>
              <div className="question-options">
                <label className="option-label">
                  <input
                    type="radio"
                    name="q3"
                    value="very clear"
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Very Clear</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q3"
                    value="somewhat clear"
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Somewhat Clear</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q3"
                    value="confusing"
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Confusing</span>
                </label>
              </div>
            </div>

            <div className="question-item">
              <p className="question-text">Would you recommend us to others?</p>
              <div className="question-options">
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="definitely"
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>Definitely</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="maybe"
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>Maybe</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="no"
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          <div className="comments-section">
            <label className="comments-label">Comments (Optional)</label>
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
            Submit Feedback
          </button>
        </form>

        <button className="cancel-btn" onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Satisfaction;