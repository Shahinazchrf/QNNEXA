// frontend/src/pages/CreateTicket.jsx

// frontend/src/pages/CreateTicket.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await api.get('/services');
        console.log('Services loaded:', response);
        
        if (response.success && response.services) {
          const formattedServices = response.services.map(s => ({
            id: s.id,
            code: s.name,
            displayName: getDisplayName(s.name),
            icon: getServiceIcon(s.name),
            description: s.description || getDescription(s.name),
            estimated_time: s.estimated_time || 15
          }));
          setServices(formattedServices);
        }
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Cannot connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const getDisplayName = (code) => {
    const names = {
      'W': 'Cash Operations',
      'D': 'Cash Operations',
      'A': 'Account Management',
      'C': 'Customer Service',
      'L': 'Loans & Credit',
      'XCH': 'Currency Exchange'
    };
    return names[code] || code;
  };

  const getDescription = (code) => {
    const desc = {
      'W': 'Withdrawal',
      'D': 'Deposit',
      'A': 'Account Opening',
      'C': 'Complaint',
      'L': 'Loan',
      'XCH': 'Currency Exchange'
    };
    return desc[code] || 'Service';
  };

  const getServiceIcon = (code) => {
    const icons = {
      'W': '💰',
      'D': '💵',
      'A': '👤',
      'C': '💬',
      'L': '🏦',
      'XCH': '💱'
    };
    return icons[code] || '🏢';
  };

  const handleCreateTicket = async () => {
    if (!selectedService) {
      alert('Please select a service');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('=================================');
      console.log('SELECTED SERVICE:', selectedService);
      console.log('SENDING CODE:', selectedService.code);
      console.log('=================================');
      
      const payload = {
        serviceCode: selectedService.code,
        customerName: 'Customer'
      };
      
      console.log('PAYLOAD:', payload);
      
      const response = await api.post('/tickets/generate', payload);
      
      console.log('RESPONSE:', response);

      if (response.success && response.ticket) {
        navigate('/queue', { 
          state: { 
            ticket: {
              number: response.ticket.number,
              service: selectedService.displayName,
              serviceCode: selectedService.code,
              icon: selectedService.icon,
              position: 1,
              waitTime: response.ticket.estimated_wait || 15
            }
          }
        });
      } else {
        setError('Error: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('ERROR:', err);
      setError('Error creating ticket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-page">
      <div className="create-ticket-header">
        <span className="logo">AGB</span>
        <span className="agency">Agency: Algiers Main</span>
      </div>

      <div className="create-ticket-content">
        <h1 className="page-title">Choose Your Service</h1>

        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#D71920', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
              >
                <span className="service-icon">{service.icon}</span>
                <span className="service-name">{service.displayName}</span>
                <span className="service-description">{service.description}</span>
                <span className="service-time">{service.estimated_time} min</span>
              </button>
            ))}
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={handleCreateTicket}
            className="create-btn"
            disabled={!selectedService || loading}
          >
            {loading ? 'Creating...' : 'Get Your Virtual Ticket +'}
          </button>

          <button onClick={() => navigate('/')} className="cancel-link">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;