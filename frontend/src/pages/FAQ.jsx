import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});

  const faqItems = [
    {
      question: "What documents be required for Gold credit card?",
      answer: "For a Gold credit card, you typically need: valid ID, proof of income, bank statements for the last 3 months, and a good credit history."
    },
    {
      question: "How Do apply Ina personal loan?",
      answer: "You can apply for a personal loan by visiting any AGB branch, using our online banking platform, or through the QONNEXEA app. Required documents include ID, proof of income, and bank statements."
    },
    {
      question: "How can I a check my account balance online?",
      answer: "You can check your account balance through our online banking portal, mobile app, or by visiting any ATM. You can also ask our virtual assistant for help."
    },
    {
      question: "What is mobile deposit?",
      answer: "Mobile deposit allows you to deposit checks using your smartphone camera through our banking app. Simply endorse the check, take photos of both sides, and submit."
    }
  ];

  const topics = ['Cards', 'Loans', 'Accounts', 'Digital Banking'];

  const toggleItem = (index) => {
    setOpenItems({
      ...openItems,
      [index]: !openItems[index]
    });
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1 className="agb-logo">AGB</h1>
        <p className="agency-name">Agency: Algiers Main</p>
      </div>

      <h2 className="faq-title">Frequently Asked Questions</h2>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search for a topic or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="topics-section">
        {topics.map((topic, index) => (
          <button key={index} className="topic-btn">
            {topic}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {faqItems.map((item, index) => (
          <div key={index} className="faq-item">
            <button
              className="faq-question"
              onClick={() => toggleItem(index)}
            >
              <span>{item.question}</span>
              <span className="faq-toggle">{openItems[index] ? '−' : '+'}</span>
            </button>
            {openItems[index] && (
              <div className="faq-answer">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="back-btn" onClick={() => navigate('/qonnexea')}>
        ← Back
      </button>
    </div>
  );
};

export default FAQ;