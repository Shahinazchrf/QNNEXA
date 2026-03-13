// frontend/src/pages/CreateTicket.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
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
        const response = await ticketService.getServices();
        
        if (response.success && response.services) {
          setServices(response.services);
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

  const getServiceDisplay = (serviceCode) => {
    const serviceMap = {
      'A': { name: 'Account Opening', icon: '👤', time: '30 min' },
      'W': { name: 'Withdrawal', icon: '💰', time: '5 min' },
      'D': { name: 'Deposit', icon: '💵', time: '10 min' },
      'L': { name: 'Loan', icon: '🏦', time: '45 min' },
      'C': { name: 'Complaint', icon: '💬', time: '20 min' },
      'XCH': { name: 'Currency Exchange', icon: '💱', time: '20 min' }
    };
    return serviceMap[serviceCode] || { name: serviceCode, icon: '🏢', time: '15 min' };
  };

  const handleCreateTicket = async (serviceCode) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🎫 Creating ticket for service:', serviceCode);
      console.log('🎫 Ticket type:', 'virtual');
      
      const response = await ticketService.createNormalTicket(
        serviceCode, 
        'Mobile User',
        'virtual'
      );
      
      console.log('📥 Response:', response);
      
      if (response.success && response.ticket) {
        console.log('✅ Ticket created:', response.ticket);
        navigate('/queue', { state: { ticket: response.ticket } });
      } else {
        console.error('❌ Creation failed:', response.error);
        setError(response.error || 'Error creating ticket');
      }
    } catch (err) {
      console.error('❌ Exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSortedServices = () => {
    const order = ['A', 'W', 'D', 'L', 'C', 'XCH'];
    return [...services].sort((a, b) => {
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  };

  return (
    <div className="create-ticket-page">
      <div className="create-ticket-header">
        <span className="logo">AGB</span>
        <span className="agency">Agency: Algiers Main</span>
      </div>

      <div className="create-ticket-content">
        <h1 className="page-title">Choose Your Service</h1>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Loading services...</div>
        ) : (
          <div className="services-grid">
            {getSortedServices().map((service) => {
              const display = getServiceDisplay(service.name);
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                >
                  <span className="service-icon">{display.icon}</span>
                  <span className="service-name">{display.name}</span>
                  <span className="service-time">{display.time}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={() => handleCreateTicket(selectedService?.name)} // ← CORRIGÉ ICI
            className="create-btn"
            disabled={!selectedService || loading}
          >
            {loading ? 'Creating...' : 'Get Your Virtual Ticket +'}
          </button>

          <button onClick={() => navigate('/qonnexea')} className="cancel-link">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;