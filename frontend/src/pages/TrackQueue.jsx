import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import './TrackQueue.css';

const TrackQueue = () => {
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await ticketService.getQueueStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) {
      setError('Veuillez entrer votre numéro de ticket');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await ticketService.trackTicket(ticketNumber);
      setTicket(data);
    } catch (err) {
      setError('Ticket non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const getPosition = () => {
    if (!ticket || !stats || ticket.status !== 'waiting') return null;
    const waitingTickets = stats.next_tickets || [];
    const position = waitingTickets.findIndex(t => t.number === ticket.number) + 1;
    return position > 0 ? position : 'En attente';
  };

  return (
    <div className="track-container">
      <h1>🔍 Suivre ma file d'attente</h1>

      {!ticket ? (
        <form onSubmit={handleTrack} className="track-form">
          <div className="form-group">
            <label>Numéro de ticket</label>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="Ex: W001 ou VIPW001"
              className="track-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-track" disabled={loading}>
            {loading ? 'Recherche...' : 'Suivre mon ticket'}
          </button>
        </form>
      ) : (
        <div className="ticket-status">
          <div className="status-header">
            <h2>Ticket {ticket.number}</h2>
            <span className={`status-badge status-${ticket.status}`}>
              {ticket.status === 'waiting' && 'En attente'}
              {ticket.status === 'called' && 'Appelé'}
              {ticket.status === 'serving' && 'En cours'}
              {ticket.status === 'completed' && 'Terminé'}
              {ticket.status === 'missed' && 'Manqué'}
            </span>
          </div>

          <div className="status-details">
            <div className="detail-item">
              <span className="detail-label">Service:</span>
              <span className="detail-value">{ticket.service}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Créé le:</span>
              <span className="detail-value">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            {ticket.status === 'waiting' && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Position:</span>
                  <span className="detail-value position">{getPosition() || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Temps d'attente:</span>
                  <span className="detail-value wait-time">
                    {ticket.estimated_wait || '?'} min
                  </span>
                </div>
              </>
            )}
          </div>

          {ticket.status === 'waiting' && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: getPosition() ? `${(getPosition() / (stats?.total_waiting || 1)) * 100}%` : '0%'
                  }}
                ></div>
              </div>
              <p className="progress-text">
                {getPosition()} sur {stats?.total_waiting || '?'} en attente
              </p>
            </div>
          )}

          {ticket.status === 'completed' && (
            <div className="survey-reminder">
              <p>✨ Votre service est terminé</p>
              <button 
                className="btn-survey"
                onClick={() => navigate(`/survey/${ticket.id}`)}
              >
                Donner mon avis
              </button>
            </div>
          )}

          <button 
            className="btn-back"
            onClick={() => {
              setTicket(null);
              setTicketNumber('');
            }}
          >
            ← Suivre un autre ticket
          </button>
        </div>
      )}

      {stats && (
        <div className="queue-stats">
          <h3>File d'attente en direct</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_waiting || 0}</div>
              <div className="stat-label">En attente</div>
            </div>
          </div>
          {stats.next_tickets && stats.next_tickets.length > 0 && (
            <div className="next-tickets">
              <h4>Prochains tickets:</h4>
              <div className="tickets-list">
                {stats.next_tickets.map((t, index) => (
                  <div key={index} className="next-ticket">
                    <span className="ticket-num">{t.number}</span>
                    <span className="ticket-service">{t.service}</span>
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