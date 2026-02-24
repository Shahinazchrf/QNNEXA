// frontend/src/pages/CreateTicket.jsx

// frontend/src/pages/CreateTicket.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // Service data with AGB color palette
  const services = [
    { id: 1, name: 'Cash Operations', icon: '💰', code: 'CASH', color: '#0B2E59' },
    { id: 2, name: 'Account Management', icon: '👤', code: 'ACCT', color: '#1E5AA8' },
    { id: 3, name: 'Corporate / VIP', icon: '🏢', code: 'VIP', color: '#2E7D32' },
    { id: 4, name: 'Cards & Digital', icon: '💳', code: 'CARD', color: '#C2185B' },
    { id: 5, name: 'Loans & Credit', icon: '🏦', code: 'LOAN', color: '#F57C00' },
    { id: 6, name: 'Investment Services', icon: '📈', code: 'INV', color: '#7B1FA2' },
  ];

  const handleCreateTicket = () => {
    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber(selectedService.code);
    const position = Math.floor(Math.random() * 8) + 3; // Random position between 3-10
    const waitTime = position * 2; // 2 minutes per person

    setTicketData({
      number: ticketNumber,
      service: selectedService.name,
      position: position,
      waitTime: waitTime,
      createdAt: new Date().toLocaleTimeString()
    });
    
    setTicketCreated(true);
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

  if (ticketCreated) {
    return (
      <div className="ticket-created-container">
        <div className="ticket-card">
          <div className="success-icon">✓</div>
          <h2>Ticket Created</h2>
          
          <div className="ticket-number-display">
            {ticketData.number}
          </div>
          
          <div className="ticket-info-grid">
            <div className="info-item">
              <span className="info-label">Service</span>
              <span className="info-value">{ticketData.service}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Position</span>
              <span className="info-value">{ticketData.position}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Wait Time</span>
              <span className="info-value">{ticketData.waitTime} min</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/track-queue')}
            className="btn-primary"
          >
            Track Position
          </button>

          <button
            onClick={() => {
              setTicketCreated(false);
              setSelectedService(null);
            }}
            className="btn-outline"
          >
            New Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ticket-page">
      {/* Header with AGB branding */}
      <div className="agb-header">
        <div className="agb-logo">AGB</div>
        <div className="agency-badge">Algiers Main</div>
      </div>

      {/* Main Content */}
      <div className="create-ticket-content">
        <h1 className="page-title">Choose Your Service</h1>

        {/* Services Grid */}
        <div className="services-grid">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
            >
              <div className="service-icon">{service.icon}</div>
              <div className="service-name">{service.name}</div>
              {selectedService?.id === service.id && (
                <div className="selected-indicator">✓</div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={handleCreateTicket}
            className="btn-primary btn-large"
            disabled={!selectedService}
          >
            Get Your Virtual Ticket
          </button>

          <button
            onClick={() => navigate('/qonnexea')}
            className="btn-link"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;