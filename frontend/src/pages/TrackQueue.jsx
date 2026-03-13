// src/pages/TrackQueue.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ticketService from '../services/ticketService';
import './TrackQueue.css';

const TrackQueue = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [ticketNumber, setTicketNumber] = useState(ticketId || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (ticketId) {
      handleTrackWithId(ticketId);
    }
  }, [ticketId]);

  const fetchStats = async () => {
    try {
      const data = await ticketService.getQueueStats();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleTrackWithId = async (number) => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketService.getTicket(number);
      
      if (response.success && response.ticket) {
        if (response.ticket.ticket_type === 'physical') {
          const positionResponse = await ticketService.getTicketPosition(number);
          if (positionResponse.success) {
            response.ticket.position = positionResponse.data.position;
            response.ticket.estimated_wait = positionResponse.data.estimated_wait;
          }
          setTicket(response.ticket);
        } else {
          setError('❌ This is a virtual ticket. Please use the virtual ticket tracking system.');
        }
      } else {
        setError('Ticket not found');
      }
    } catch (err) {
      setError('Ticket not found');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) {
      setError('Please enter your ticket number');
      return;
    }
    await handleTrackWithId(ticketNumber);
  };

  const getPosition = () => {
    if (!ticket || !stats || ticket.status !== 'waiting') return null;
    const waitingTickets = stats.next_tickets || [];
    const position = waitingTickets.findIndex(t => t.number === ticket.number) + 1;
    return position > 0 ? position : 'Waiting';
  };

  return (
    <div className="track-container">
      <div className="track-header">
        <h1>🔍 Track My Queue</h1>
        <p>Enter your ticket number to see your current position</p>
        <p className="physical-note">🏧 Only physical tickets can be tracked here</p>
      </div>

      {!ticket ? (
        <form onSubmit={handleTrack} className="track-form">
          <div className="track-form-group">
            <label>Ticket Number</label>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="e.g., A001, W043"
              className="track-input"
            />
          </div>

          {error && <div className="track-error">{error}</div>}

          <button type="submit" className="track-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Track my ticket'}
          </button>
        </form>
      ) : (
        <div className="track-result">
          <div className="track-ticket-header">
            <h2>Ticket {ticket.number}</h2>
            <span className={`track-status track-status-${ticket.status}`}>
              {ticket.status === 'waiting' && 'Waiting'}
              {ticket.status === 'called' && 'Called'}
              {ticket.status === 'serving' && 'Serving'}
              {ticket.status === 'completed' && 'Completed'}
              {ticket.status === 'missed' && 'Missed'}
            </span>
          </div>

          <div className="track-ticket-details">
            <div className="track-detail-row">
              <span className="track-detail-label">Service:</span>
              <span className="track-detail-value">{ticket.service}</span>
            </div>
            <div className="track-detail-row">
              <span className="track-detail-label">Created:</span>
              <span className="track-detail-value">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            {ticket.status === 'waiting' && (
              <>
                <div className="track-detail-row">
                  <span className="track-detail-label">Position:</span>
                  <span className="track-detail-value track-position">
                    {ticket.position || getPosition() || 'N/A'}
                  </span>
                </div>
                <div className="track-detail-row">
                  <span className="track-detail-label">Est. wait:</span>
                  <span className="track-detail-value track-wait">
                    {ticket.estimated_wait || '?'} min
                  </span>
                </div>
              </>
            )}
          </div>

          {ticket.status === 'waiting' && (
            <div className="track-progress">
              <div className="track-progress-bar">
                <div 
                  className="track-progress-fill"
                  style={{ 
                    width: getPosition() ? `${(getPosition() / (stats?.total_waiting || 1)) * 100}%` : '0%'
                  }}
                ></div>
              </div>
              <p className="track-progress-text">
                {getPosition() || ticket.position} of {stats?.total_waiting || '?'} waiting
              </p>
            </div>
          )}

          {ticket.status === 'completed' && (
            <div className="track-survey">
              <p>✨ Your service is complete</p>
              <button 
                className="track-survey-btn"
                onClick={() => navigate(`/satisfaction/${ticket.id}`)}
              >
                Rate your experience
              </button>
            </div>
          )}

          <button 
            className="track-back-btn"
            onClick={() => {
              setTicket(null);
              setTicketNumber('');
            }}
          >
            ← Track another ticket
          </button>
        </div>
      )}

      {/* ✅ SUPPRIME TOUT CE BLOC */}
    </div>
  );
};

export default TrackQueue;