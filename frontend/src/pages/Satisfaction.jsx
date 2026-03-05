// frontend/src/pages/Satisfaction.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import surveyService from '../services/surveyService';
import './Satisfaction.css';

const Satisfaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [fastService, setFastService] = useState(false);
  const [professionalStaff, setProfessionalStaff] = useState(false);
  const [helpfulSupport, setHelpfulSupport] = useState(false);
  const [cleanAgency, setCleanAgency] = useState(false);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ticketInfo = location.state?.ticket;
  const ticketNumber = ticketInfo?.number || 'Unknown';
  const ticketService = ticketInfo?.service || 'Unknown';
  
  const [answers, setAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: ''
  });

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

  const handleAnswerChange = (question, value) => {
    setAnswers({
      ...answers,
      [question]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedRating = parseInt(answers.q1);
    
    if (!selectedRating || isNaN(selectedRating) || selectedRating < 1 || selectedRating > 5) {
      alert('Please rate the waiting time (question 1)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ticketId = location.state?.ticket?.id;
      
      if (!ticketId) {
        alert('No ticket ID found. Please create a ticket first.');
        navigate('/create-ticket');
        return;
      }
      
      const response = await surveyService.submitSurvey(
        ticketId,
        selectedRating,
        comments
      );

      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || 'Failed to submit survey');
      }
    } catch (err) {
      setError('Error submitting survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`satisfaction-page ${darkMode ? 'dark' : ''}`}>
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
            <button className="nav-item" onClick={() => handleNavigation('/queue')}>
              <span className="nav-icon">📊</span>
              <span className="nav-label">Tracking Queue</span>
            </button>
            <button className="dark-mode-btn" onClick={() => setDarkMode(!darkMode)}>
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

          <button className={`nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`} onClick={() => handleNavigation('/satisfaction')}>
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
        <button className={`mobile-nav-item ${location.pathname === '/satisfaction' ? 'active' : ''}`} onClick={() => handleNavigation('/satisfaction')}>
          <span className="mobile-nav-icon">⭐</span>
          <span>Satisfaction</span>
        </button>
      </div>

      <div className="satisfaction-container">
        <div className="satisfaction-header">
          <span className="logo">AGB</span>
          <span className="agency">Agency: Algiers Main</span>
        </div>

        <h1 className="satisfaction-title">Thank you for visiting!</h1>
        <p className="satisfaction-subtitle">How was your experience today?</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {ticketInfo && (
          <div className="ticket-info-card">
            <div>
              <span className="ticket-info-label">Ticket Number</span>
              <div className="ticket-info-number">{ticketNumber}</div>
            </div>
            <div className="ticket-info-service">
              <span className="ticket-info-label">Service</span>
              <span className="ticket-info-service-name">{ticketService}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="satisfaction-form">
          {/* Star Rating */}
          <div className="rating-section">
            <label className="section-label">Overall Rating *</label>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="rating-label">
              {rating === 0 && "Tap to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Criteria Checklist */}
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

          {/* Questions Section */}
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
                      checked={answers.q1 === value.toString()}
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
                    checked={answers.q2 === 'yes'}
                    onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  />
                  <span>Yes</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q2"
                    value="no"
                    checked={answers.q2 === 'no'}
                    onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  />
                  <span>No</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q2"
                    value="somewhat"
                    checked={answers.q2 === 'somewhat'}
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
                    checked={answers.q3 === 'very clear'}
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Very Clear</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q3"
                    value="somewhat clear"
                    checked={answers.q3 === 'somewhat clear'}
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Somewhat Clear</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q3"
                    value="confusing"
                    checked={answers.q3 === 'confusing'}
                    onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  />
                  <span>Confusing</span>
                </label>
              </div>
            </div>

            <div className="question-item">
              <p className="question-text">Would you recommend our service to others?</p>
              <div className="question-options">
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="definitely"
                    checked={answers.q4 === 'definitely'}
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>Definitely</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="maybe"
                    checked={answers.q4 === 'maybe'}
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>Maybe</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name="q4"
                    value="no"
                    checked={answers.q4 === 'no'}
                    onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Comments Section */}
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
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
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