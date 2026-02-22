import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Satisfaction.css';

const Satisfaction = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const criteria = [
    { id: 'fast', label: 'Fast Service' },
    { id: 'professional', label: 'Professional Staff' },
    { id: 'helpful', label: 'Helpful Support' },
    { id: 'clean', label: 'Clean Agency' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici vous enverrez les données au backend
    console.log({ ticketId, rating, comments });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="satisfaction-container">
        <div className="satisfaction-header">
          <h1 className="agb-logo">AGB</h1>
          <p className="agency-name">Agency: Algiers Main</p>
        </div>

        <div className="thank-you-card">
          <h2 className="thank-you-title">Thank you for visiting!</h2>
          <div className="thank-you-stars">★★★★★</div>
          <p className="thank-you-message">
            Your feedback has been submitted successfully.<br />
            We appreciate your time and help in improving our services.
          </p>
          <button className="home-btn" onClick={() => navigate('/qonnexea')}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="satisfaction-container">
      <div className="satisfaction-header">
        <h1 className="agb-logo">AGB</h1>
        <p className="agency-name">Agency: Algiers Main</p>
      </div>

      <h2 className="satisfaction-title">Thank you for visiting!</h2>

      <div className="rating-section">
        <div className="stars-container">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <span
                key={index}
                className={`star ${ratingValue <= (hover || rating) ? 'active' : ''}`}
                onClick={() => setRating(ratingValue)}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </span>
            );
          })}
        </div>
        <p className="rating-question">How was your experience today?</p>
      </div>

      <form onSubmit={handleSubmit} className="satisfaction-form">
        <div className="criteria-grid">
          {criteria.map((item) => (
            <label key={item.id} className="criteria-item">
              <input type="checkbox" className="criteria-checkbox" />
              <span className="criteria-label">{item.label}</span>
            </label>
          ))}
        </div>

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

        <button type="submit" className="submit-btn">
          Submit Feedback
        </button>
      </form>

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
    </div>
  );
};

export default Satisfaction;