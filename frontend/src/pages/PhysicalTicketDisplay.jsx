// frontend/src/pages/PhysicalTicketDisplay.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PhysicalTicketDisplay.css';

const PhysicalTicketDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    if (location.state?.ticket) {
      setTicketData(location.state.ticket);
    } else {
      navigate('/tablet');
    }
  }, [location, navigate]);

  if (!ticketData) {
    return null;
  }

  return (
    <div className="physical-display-container">
      <div className="ticket-display">
        <div className="qmatic-header">
          <h1>QONNEXA</h1>
        </div>

        <div className="ticket-message">
          <h2>It's your turn!</h2>
          <p className="ready-message">Please proceed to:</p>
        </div>

        <div className="ticket-details">
          <div className="ticket-number-large">{ticketData.number}</div>
          <div className="service-name">{ticketData.service}</div>
          <div className="web-service-point">
            <p>{ticketData.service}</p>
          </div>
        </div>

        <div className="ticket-footer">
          <p>Please wait for your number to be called</p>
          {/* Removed the auto-close timer */}
        </div>
      </div>
    </div>
  );
};

export default PhysicalTicketDisplay;