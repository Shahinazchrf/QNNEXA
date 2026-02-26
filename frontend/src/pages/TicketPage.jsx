// src/pages/TicketPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import './TicketPage.css';

const TicketPage = () => {
  const [step, setStep] = useState(1);
  // Supprimé selectedService car non utilisé pour l'instant
  const ticketNumber = 'A061';

  const services = [
    { id: 'cash', name: 'Cash Operations', icon: '💰' },
    { id: 'customer', name: 'Customer Service', icon: '👤' },
    { id: 'corporate', name: 'Corporate / VIP', icon: '🏢' },
    { id: 'cards', name: 'Cards & Digital', icon: '💳' },
  ];

  const handleServiceSelect = () => {
    setStep(2);
  };

  if (step === 2) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="ticket-content">
          <div className="ticket-card">
            <h2>Your Ticket:</h2>
            <div className="ticket-number">{ticketNumber}</div>
            <p>You are currently: #3 in line</p>
            <div className="ticket-info">
              <p>Service: Cash Operations</p>
              <p>Estimated wait: 12 minutes</p>
            </div>
            <button className="btn-primary" onClick={() => window.location.href='/queue'}>
              Track my position
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="ticket-content">
        <h1>Choose Your Service</h1>
        <div className="services-grid">
          {services.map(s => (
            <div key={s.id} className="service-card" onClick={handleServiceSelect}>
              <span className="service-icon">{s.icon}</span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={handleServiceSelect}>
          Get Your Virtual Ticket +
        </button>
        <button className="btn-cancel" onClick={() => window.location.href='/'}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TicketPage;