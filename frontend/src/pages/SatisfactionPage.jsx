// src/pages/SatisfactionPage.js

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import surveyService from '../services/surveyService';
import '../../styles/pages/SatisfactionPage.css';

const SatisfactionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketData = location.state?.ticket;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [criteria, setCriteria] = useState({
    fastService: false,
    professionalStaff: false,
    helpfulSupport: false,
    cleanAgency: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const questions = [
    "How would you rate the waiting time?",
    "Was the staff helpful?",
    "Was the process clear?",
    "Would you recommend us to others?"
  ];

  const [answers, setAnswers] = useState({});

  const handleCriteriaChange = (e) => {
    setCriteria({
      ...criteria,
      [e.target.name]: e.target.checked
    });
  };

  const handleAnswerChange = (index, value) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please give a rating');
      return;
    }

    setLoading(true);

    const surveyData = {
      ticket_id: ticketData?.id || 'test-ticket-123',
      rating,
      comments,
      criteria,
      answers,
      submitted_at: new Date().toISOString()
    };

    try {
      // Envoyer au backend
      const response = await surveyService.submitSurvey(surveyData);
      console.log('Survey submitted:', response);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Error submitting survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="satisfaction-page">
        <Navbar />
        <div className="satisfaction-content">
          <div className="thank-you-card">
            <div className="thank-you-icon">🎉</div>
            <h2 className="thank-you-title">Thank you for your feedback!</h2>
            <p className="thank-you-message">
              Your response has been recorded and will help us improve our services.
            </p>
            <div className="thank-you-details">
              <p>Rating: {rating}/5 ⭐</p>
              {comments && <p>Comment: {comments}</p>}
            </div>
            <button 
              className="thank-you-btn"
              onClick={() => navigate('/queue')}
            >
              Return to Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="satisfaction-page">
      <Navbar />
      
      <div className="satisfaction-content">
        <h1 className="satisfaction-title">How was your experience?</h1>
        <p className="satisfaction-subtitle">Your feedback helps us improve</p>

        {ticketData && (
          <div className="ticket-info">
            <span>Ticket: {ticketData.number}</span>
            <span>Service: {ticketData.service}</span>
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
            <label className="section-label">What went well? (Select all that apply)</label>
            <div className="criteria-grid">
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="fastService"
                  checked={criteria.fastService}
                  onChange={handleCriteriaChange}
                />
                <span>⚡ Fast Service</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="professionalStaff"
                  checked={criteria.professionalStaff}
                  onChange={handleCriteriaChange}
                />
                <span>👔 Professional Staff</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="helpfulSupport"
                  checked={criteria.helpfulSupport}
                  onChange={handleCriteriaChange}
                />
                <span>🤝 Helpful Support</span>
              </label>
              <label className="criteria-item">
                <input
                  type="checkbox"
                  name="cleanAgency"
                  checked={criteria.cleanAgency}
                  onChange={handleCriteriaChange}
                />
                <span>🧹 Clean Agency</span>
              </label>
            </div>
          </div>

          {/* Quick Questions */}
          <div className="questions-section">
            <label className="section-label">Quick Questions</label>
            {questions.map((question, index) => (
              <div key={index} className="question-item">
                <p className="question-text">{question}</p>
                <div className="question-options">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="option-label">
                      <input
                        type="radio"
                        name={`q${index}`}
                        value={value}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comments */}
          <div className="comments-section">
            <label className="section-label">Additional Comments (Optional)</label>
            <textarea
              className="comments-input"
              placeholder="Tell us more about your experience..."
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

        <button className="cancel-btn" onClick={() => navigate('/queue')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SatisfactionPage;