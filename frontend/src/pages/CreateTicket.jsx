import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import './CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadServices();
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const data = await ticketService.getServices();
      setServices(data);
    } catch (err) {
      setError('Impossible de charger les services');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ticketService.getQueueStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      setError('Veuillez sélectionner un service');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const service = services.find(s => s.id === selectedService);
      const newTicket = await ticketService.createNormalTicket(
        service.name,
        customerName || 'Client'
      );
      setTicket(newTicket);
    } catch (err) {
      setError('Erreur lors de la création du ticket');
    } finally {
      setLoading(false);
    }
  };

  if (ticket) {
    return (
      <div className="ticket-created">
        <div className="success-icon">✅</div>
        <h2>Ticket créé avec succès !</h2>
        
        <div className="ticket-card">
          <div className="ticket-number">{ticket.number}</div>
          <div className="ticket-service">{ticket.service}</div>
          <div className="ticket-time">
            Créé à: {new Date(ticket.created_at).toLocaleTimeString()}
          </div>
          <div className="ticket-wait">
            Temps d'attente estimé: {ticket.estimated_wait || 15} min
          </div>
        </div>

        <div className="ticket-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/track-queue')}
          >
            Suivre ma position
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setTicket(null);
              setSelectedService('');
              setCustomerName('');
            }}
          >
            Nouveau ticket
          </button>
        </div>

        <div className="info-message">
          <p>💡 Vous recevrez une notification quand ce sera votre tour</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ticket-container">
      <h1>🎫 Créer un ticket</h1>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreateTicket} className="ticket-form">
        <div className="form-group">
          <label>Choisissez un service</label>
          <select 
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            required
          >
            <option value="">-- Sélectionnez --</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.description || ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Votre nom (optionnel)</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Entrez votre nom"
          />
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading}
        >
          {loading ? 'Création...' : 'Créer mon ticket'}
        </button>
      </form>

      {stats && (
        <div className="queue-info">
          <h3>File d'attente en direct</h3>
          <div className="stats-simple">
            <p>📊 {stats.total_waiting || 0} personne(s) en attente</p>
            {stats.next_tickets && stats.next_tickets.length > 0 && (
              <div className="next-tickets">
                <small>Prochains: {stats.next_tickets.map(t => t.number).join(', ')}</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;