// frontend/src/pages/TrackMyQueue.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ticketService from '../services/ticketService';
import './TrackMyQueue.css';

const TrackMyQueue = () => {
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [socket, setSocket] = useState(null);
  const [livePosition, setLivePosition] = useState(null);
  const [liveWaitTime, setLiveWaitTime] = useState(null);
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket
  useEffect(() => {
    const socketUrl = 'http://10.158.95.243:5000';
    console.log('🔌 Connecting to WebSocket...');
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🟢 WebSocket connected');
      setConnected(true);
    });

    newSocket.on('connect_error', (err) => {
      console.log('🔴 WebSocket connection error:', err);
      setConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 WebSocket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Listen for ticket updates
  useEffect(() => {
    if (!socket || !ticketData) return;

    console.log(`👀 Tracking ticket: ${ticketData.number}`);
    socket.emit('track-ticket', ticketData.number);

    socket.on('ticket-update', (update) => {
      console.log('📡 Live update received:', update);
      if (update.ticket_number === ticketData.number) {
        setLivePosition(update.position);
        setLiveWaitTime(update.wait_time);
        setTicketData(prev => ({
          ...prev,
          position_in_queue: update.position,
          estimated_wait: update.wait_time,
          status: update.status,
          counter: update.counter
        }));
      }
    });

    return () => {
      if (socket && ticketData) {
        socket.emit('untrack-ticket', ticketData.number);
        socket.off('ticket-update');
      }
    };
  }, [socket, ticketData]);

 const handleSearch = async (e) => {
  e.preventDefault();
  
  if (!ticketNumber.trim()) {
    alert('Please enter your ticket number');
    return;
  }

  setLoading(true);
  setError('');
  setSearched(true);
  setTicketData(null);

  try {
    // 1. Récupérer les infos du ticket
    const response = await ticketService.getTicket(ticketNumber);
    console.log('📥 Ticket response:', response);
    
    if (response.success && response.ticket) {
      // ✅ POUR LES TICKETS VIRTUELS
      if (response.ticket.ticket_type === 'virtual') {
        console.log('✅ Virtual ticket found:', response.ticket);
        
        // 2. Récupérer la position depuis l'API /position
        const positionResponse = await ticketService.getTicketPosition(ticketNumber);
        console.log('📊 Position response:', positionResponse);
        
     if (positionResponse.success) {
  console.log('📊 Position from API:', positionResponse.data.position);
  
  // ✅ Force la valeur
  setLivePosition(positionResponse.data.position);
  setLiveWaitTime(positionResponse.data.estimated_wait);
  
  // Met à jour ticketData aussi
  response.ticket.position_in_queue = positionResponse.data.position;
  response.ticket.estimated_wait = positionResponse.data.estimated_wait;
  
  // 🔴 LOG DE VÉRIFICATION
  console.log('🎫 Updated ticket data:', response.ticket);
}

setTicketData(response.ticket);  
        setTicketData(response.ticket);
        setLivePosition(response.ticket.position_in_queue);
        setLiveWaitTime(response.ticket.estimated_wait);
      } else {
        // Physical ticket - show error
        setError('❌ This is a physical ticket. Please use the physical ticket tracking system.');
        setTicketData(null);
      }
    } else {
      setError('Ticket not found. Please check your ticket number and try again.');
      setTicketData(null);
    }
  } catch (err) {
    console.error('Error searching ticket:', err);
    setError('Error searching for ticket. Please try again.');
    setTicketData(null);
  } finally {
    setLoading(false);
  }
};

  const getStatusText = (status) => {
    const statusMap = {
      'waiting': 'IN QUEUE',
      'called': 'CALLED TO COUNTER',
      'serving': 'BEING SERVED',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'missed': 'MISSED'
    };
    return statusMap[status] || status;
  };

  const getServiceName = (serviceCode) => {
    const services = {
      'A': 'Account Opening',
      'W': 'Withdrawal',
      'D': 'Deposit',
      'L': 'Loan',
      'C': 'Complaint',
      'XCH': 'Currency Exchange'
    };
    return services[serviceCode] || serviceCode;
  };

  const formatWaitTime = (minutes) => {
    if (!minutes) return '?';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get ticket type icon and class
  const getTicketTypeInfo = (type) => {
    if (type === 'physical') {
      return {
        icon: '🏧',
        label: 'PHYSICAL TICKET',
        className: 'ticket-type-physical'
      };
    } else {
      return {
        icon: '📱',
        label: 'VIRTUAL TICKET',
        className: 'ticket-type-virtual'
      };
    }
  };

  return (
    <div className="track-queue-page">
      {/* Header with back button */}
      <div className="track-header">
        <button className="back-btn" onClick={() => navigate('/qonnexea')}>
          ← Back
        </button>
        <h1>Track My Queue</h1>
        <p>Enter your ticket number to see your current position</p>
        <p className="virtual-note">📱 Only virtual tickets can be tracked here</p>
      </div>

      {/* Search Form */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Enter ticket number (e.g., A001, W043)"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Track My Ticket'}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="results-section">
          {error ? (
            <div className="error-message">{error}</div>
          ) : ticketData ? (
            <div className="ticket-card">
              {/* Live/Connection indicator */}
              <div className="connection-indicator">
                {connected ? (
                  <span className="connected">
                    <span className="live-dot">●</span> LIVE
                  </span>
                ) : (
                  <span className="disconnected">
                    <span className="dead-dot">●</span> OFFLINE
                  </span>
                )}
              </div>

              {/* Ticket Type Badge */}
              {ticketData.ticket_type && (
                <div className={`ticket-type-badge ${getTicketTypeInfo(ticketData.ticket_type).className}`}>
                  <span className="ticket-type-icon">{getTicketTypeInfo(ticketData.ticket_type).icon}</span>
                  <span className="ticket-type-label">{getTicketTypeInfo(ticketData.ticket_type).label}</span>
                </div>
              )}

              {/* Ticket Info */}
              <div className="ticket-info">
                <div className="ticket-number">{ticketData.number}</div>
                <div className="ticket-service">
                  Service: {getServiceName(ticketData.service)}
                </div>
                <div className="ticket-time">
                  Created: {new Date(ticketData.created_at).toLocaleString()}
                </div>
              </div>

              {/* Status Badge */}
              <div className="status-section">
                <div className={`status-badge status-${ticketData.status}`}>
                  {getStatusText(ticketData.status)}
                </div>
              </div>

{/* Queue Position & Wait Time - LIVE UPDATES */}
{ticketData.status === 'waiting' && (
  <>
    <div className="wait-time">
      <span className="wait-label">Current Position:</span>
      <span className="wait-value">
        {/* 🔴 IGNORE ticketData.position_in_queue, utilise SEULEMENT la valeur de l'API */}
        {livePosition || 'Calcul en cours...'}
        {livePosition && <span className="live-badge">LIVE</span>}
      </span>
    </div>
    <div className="wait-time">
      <span className="wait-label">Estimated Wait:</span>
      <span className="wait-value">
        {formatWaitTime(liveWaitTime || ticketData.estimated_wait)}
        {liveWaitTime && <span className="live-badge">LIVE</span>}
      </span>
    </div>
  </>
)}

              {/* Counter Info if called or serving */}
              {(ticketData.status === 'called' || ticketData.status === 'serving') && (
                <div className="counter-info">
                  <h3>Please proceed to:</h3>
                  <div className="counter-number">Counter {ticketData.counter || 'N/A'}</div>
                </div>
              )}

              {/* Refresh Button (Manual fallback) */}
              <button 
                className="refresh-btn"
                onClick={handleSearch}
              >
                Refresh Status
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TrackMyQueue;