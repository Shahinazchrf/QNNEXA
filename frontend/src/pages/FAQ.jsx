// frontend /src/pages/FAQ.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState({});

  const faqItems = [
    {
      question: "What documents are required for Gold credit card?",
      answer: "For a Gold credit card, you typically need: valid ID (passport or national ID), proof of income (salary slips or tax returns), bank statements for the last 3 months, and a good credit history. Additional documents may be required based on your employment status."
    },
    {
      question: "How do I apply for a personal loan?",
      answer: "You can apply for a personal loan by visiting any AGB branch, using our online banking platform, or through the QONNEXEA app. Required documents include ID, proof of income, and bank statements. The application process takes approximately 24-48 hours for approval."
    },
    {
      question: "How can I check my account balance online?",
      answer: "You can check your account balance through our online banking portal, mobile app, or by visiting any ATM. You can also ask our virtual assistant for help. Simply log in to your account and your balance will be displayed on the dashboard."
    },
    {
      question: "What is mobile deposit?",
      answer: "Mobile deposit allows you to deposit checks using your smartphone camera through our banking app. Simply endorse the check, take photos of both sides, and submit. The funds are typically available within 1-2 business days."
    },
    {
      question: "How do I block my lost card?",
      answer: "You can block your lost card immediately through our mobile app, online banking, or by calling our 24/7 support line at 1530. Once blocked, you can request a replacement card through the same channels."
    },
    {
      question: "What are the bank's working hours?",
      answer: "Our branches are open Monday to Friday from 8:00 AM to 5:00 PM, and Saturday from 9:00 AM to 1:00 PM. Digital services and customer support are available 24/7 through our app, website, and phone line."
    },
    {
      question: "How do I update my personal information?",
      answer: "You can update your personal information through our online banking portal, mobile app, or by visiting any AGB branch. Changes to sensitive information like name or address may require additional verification."
    }
  ];

  const topics = ['Cards', 'Loans', 'Accounts', 'Digital Banking', 'Security', 'General'];

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
    <div className="faq-container">
      <Navbar />
      
      <div className="faq-header">
        <h1 className="faq-main-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">Find answers to common questions about our services</p>
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

      <div className="faq-topics">
        {topics.map((topic, index) => (
          <button key={index} className="topic-btn">
            {topic}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item, index) => (
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
          ))
        ) : (
          <div className="no-results">
            <p>No questions found matching your search.</p>
          </div>
        )}
      </div>

      <div className="faq-footer">
        <p>Still have questions?</p>
        <button className="contact-btn" onClick={() => navigate('/support')}>
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default FAQ;