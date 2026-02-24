//src/pages/TrackQueue.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
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
      const data = await ticketService.trackTicket(number);
      setTicket(data);
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
      <Navbar />
      
      <div className="track-header">
        <h1>🔍 Track My Queue</h1>
        <p>Enter your ticket number to see your current position</p>
      </div>

      {!ticket ? (
        <form onSubmit={handleTrack} className="track-form">
          <div className="track-form-group">
            <label>Ticket Number</label>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="e.g., W001 or VIPW001"
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
                    {getPosition() || 'N/A'}
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
                {getPosition()} of {stats?.total_waiting || '?'} waiting
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

      {stats && (
        <div className="track-stats">
          <h3>Live Queue</h3>
          <div className="track-stats-grid">
            <div className="track-stat-card">
              <div className="track-stat-value">{stats.total_waiting || 0}</div>
              <div className="track-stat-label">Waiting</div>
            </div>
          </div>
          {stats.next_tickets && stats.next_tickets.length > 0 && (
            <div className="track-next-tickets">
              <h4>Next tickets:</h4>
              <div className="track-next-list">
                {stats.next_tickets.map((t, index) => (
                  <div key={index} className="track-next-item">
                    <span className="track-next-number">{t.number}</span>
                    <span className="track-next-service">{t.service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackQueue;