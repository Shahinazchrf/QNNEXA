//frontend/src/pages/CardsPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './CardsPage.css';

const CardsPage = () => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      type: 'Visa Classic',
      limit: 'DA 50,000',
      annualFee: 'DA 1,500',
      cashback: '0.5%',
      image: '💳',
      color: '#1E3A8A',
      benefits: ['Online payments', 'ATM withdrawals', 'Contactless']
    },
    {
      id: 2,
      type: 'Visa Gold',
      limit: 'DA 150,000',
      annualFee: 'DA 3,000',
      cashback: '1%',
      image: '💳',
      color: '#B8860B',
      benefits: ['Higher limit', 'Travel insurance', 'Priority support']
    },
    {
      id: 3,
      type: 'Mastercard Platinum',
      limit: 'DA 300,000',
      annualFee: 'DA 5,000',
      cashback: '1.5%',
      image: '💳',
      color: '#2E8B57',
      benefits: ['Airport lounge', 'Concierge service', 'Purchase protection']
    },
    {
      id: 4,
      type: 'Business Card',
      limit: 'DA 500,000',
      annualFee: 'DA 8,000',
      cashback: '2%',
      image: '💳',
      color: '#4A4A4A',
      benefits: ['Expense tracking', 'Employee cards', 'Business insurance']
    }
  ];

  const handleApply = (cardId) => {
    setSelectedCard(cardId);
    alert(`Application for ${cards.find(c => c.id === cardId).type} submitted!`);
  };

  return (
    <div className="cards-page">
      <Navbar />
      
      <div className="cards-header">
        <h1 className="cards-title">💳 Cards & Payments</h1>
        <p className="cards-subtitle">Choose the card that suits your needs</p>
      </div>

      <div className="cards-grid">
        {cards.map((card) => (
          <div 
            key={card.id} 
            className={`card-item ${selectedCard === card.id ? 'selected' : ''}`}
            style={{ borderTop: `4px solid ${card.color}` }}
          >
            <div className="card-header">
              <span className="card-icon">{card.image}</span>
              <h3 className="card-type">{card.type}</h3>
            </div>
            
            <div className="card-details">
              <div className="card-limit">
                <span className="detail-label">Limit:</span>
                <span className="detail-value">{card.limit}</span>
              </div>
              <div className="card-fee">
                <span className="detail-label">Annual Fee:</span>
                <span className="detail-value">{card.annualFee}</span>
              </div>
              <div className="card-cashback">
                <span className="detail-label">Cashback:</span>
                <span className="detail-value">{card.cashback}</span>
              </div>
            </div>

            <div className="card-benefits">
              {card.benefits.map((benefit, index) => (
                <span key={index} className="benefit-tag">✓ {benefit}</span>
              ))}
            </div>

            <button 
              className="apply-btn"
              onClick={() => handleApply(card.id)}
              style={{ backgroundColor: card.color }}
            >
              Apply Now
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="cards-actions">
        <h3>Quick Actions</h3>
        <div className="actions-buttons">
          <button className="action-btn" onClick={() => navigate('/chat')}>
            💬 Chat with Support
          </button>
          <button className="action-btn" onClick={() => navigate('/faq')}>
            ❓ Card FAQs
          </button>
          <button className="action-btn" onClick={() => navigate('/create-ticket')}>
            🎫 New Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardsPage;