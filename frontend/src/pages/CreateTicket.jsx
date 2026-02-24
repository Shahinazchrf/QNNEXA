// frontend/src/pages/CreateTicket.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    { id: 1, name: 'Cash Operations', icon: '💰', code: 'CASH' },
    { id: 2, name: 'Account Management', icon: '👤', code: 'ACCT' },
    { id: 3, name: 'Corporate / VIP', icon: '🏢', code: 'VIP' },
    { id: 4, name: 'Cards & Digital', icon: '💳', code: 'CARD' },
    { id: 5, name: 'Loans & Credit', icon: '🏦', code: 'LOAN' },
    { id: 6, name: 'Investment Services', icon: '📈', code: 'INV' },
  ];

  const handleCreateTicket = () => {
    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    // Generate ticket data
    const ticketNumber = generateTicketNumber(selectedService.code);
    const position = Math.floor(Math.random() * 15) + 3; // Random position between 3-18
    const waitTime = position * 2;

    const ticketData = {
      number: ticketNumber,
      service: selectedService.name,
      serviceCode: selectedService.code,
      position: position,
      waitTime: waitTime,
      icon: selectedService.icon,
    };

    // Navigate to queue page with ticket data
    navigate('/queue', { state: { ticket: ticketData } });
  };

  const generateTicketNumber = (serviceCode) => {
    const prefixes = {
      'CASH': 'C',
      'ACCT': 'A',
      'VIP': 'V',
      'CARD': 'D',
      'LOAN': 'L',
      'INV': 'I'
    };
    const prefix = prefixes[serviceCode] || 'T';
    const randomNum = Math.floor(Math.random() * 900 + 100);
    return `${prefix}${randomNum}`;
  };

  return (
    <div className="create-ticket-page">
      <div className="create-ticket-header">
        <span className="logo">AGB</span>
        <span className="agency">Agency: Algiers Main</span>
      </div>

      <div className="create-ticket-content">
        <h1 className="page-title">Choose Your Service</h1>

        <div className="services-grid">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
            >
              <span className="service-icon">{service.icon}</span>
              <span className="service-name">{service.name}</span>
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <button
            onClick={handleCreateTicket}
            className="create-btn"
            disabled={!selectedService}
          >
            Get Your Virtual Ticket +
          </button>

          <button
            onClick={() => navigate('/')}
            className="cancel-link"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;