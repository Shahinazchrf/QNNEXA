// frontend/src/pages/TrackQueue.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrackQueue.css';

const TrackQueue = () => {
  const navigate = useNavigate();
  const [ticketNumber, setTicketNumber] = useState('');
  const [showTracking, setShowTracking] = useState(false);

  // Sample ticket data
  const ticketData = {
    number: 'A45',
    service: 'Retrait',
    createdAt: '10:30',
    estimatedWait: '12 minutes',
    position: 8,
    notifications: [
      'En attente',
      'Guichets ouverts',
      'En cours',
      'Servis aujourd\'hui'
    ],
    lastNotification: 'Il reste 3 personnes avant vous. Préparez vos documents.'
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (ticketNumber.trim()) {
      setShowTracking(true);
    }
  };

  if (!showTracking) {
    return (
      <div className="track-queue-page">
        <div className="track-queue-container">
          <h1 className="track-queue-title">Suivi de File d'Attente</h1>
          <p className="track-queue-subtitle">
            Entrez votre numéro de ticket pour suivre votre position
          </p>

          <form onSubmit={handleTrack} className="track-queue-form">
            <input
              type="text"
              placeholder="Numéro de ticket"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              className="track-queue-input"
              autoFocus
            />
            <button type="submit" className="track-queue-submit">
              Suivre
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="track-queue-page">
      <div className="track-queue-container">
        {/* Ticket Info */}
        <div className="ticket-info-card">
          <div className="ticket-number">{ticketData.number}</div>
          <div className="ticket-details">
            <p>Service: {ticketData.service}</p>
            <p>Créé à {ticketData.createdAt}</p>
          </div>
        </div>

        {/* Estimated Wait Time */}
        <div className="wait-time-card">
          <span className="wait-time-label">Temps d'attente estimé:</span>
          <span className="wait-time-value">{ticketData.estimatedWait}</span>
        </div>

        {/* Stats Table */}
        <table className="stats-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Dernière notification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="position-value">{ticketData.position}</td>
              <td>{ticketData.notifications[0]}</td>
            </tr>
            <tr>
              <td>3</td>
              <td>{ticketData.notifications[1]}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>{ticketData.notifications[2]}</td>
            </tr>
            <tr>
              <td>45</td>
              <td>{ticketData.notifications[3]}</td>
            </tr>
          </tbody>
        </table>

        {/* Last Notification */}
        <div className="last-notification">
          <span className="notification-icon">⚠️</span>
          <span className="notification-text">
            <strong>Dernière notification</strong><br />
            {ticketData.lastNotification}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrackQueue;