//src/components/common/Navbar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo" onClick={() => navigate('/')}>AGB</span>
      </div>
      
      <div className="nav-center">
        <button 
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>
        <button 
          className={`nav-item ${isActive('/create-ticket') ? 'active' : ''}`}
          onClick={() => navigate('/create-ticket')}
        >
          🎫 Ticket
        </button>
        <button 
          className={`nav-item ${isActive('/queue') ? 'active' : ''}`}
          onClick={() => navigate('/queue')}
        >
          📊 Queue
        </button>
        <button 
          className={`nav-item ${isActive('/satisfaction') ? 'active' : ''}`}
          onClick={() => navigate('/satisfaction')}
        >
          ⭐ Feedback
        </button>
        <button 
          className={`nav-item ${isActive('/faq') ? 'active' : ''}`}
          onClick={() => navigate('/faq')}
        >
          ❓ FAQ
        </button>
        <button 
          className={`nav-item ${isActive('/support') ? 'active' : ''}`}
          onClick={() => navigate('/support')}
        >
          💬 Chat
        </button>
      </div>

      <div className="nav-right">
        <span className="agency">Algiers Main</span>
      </div>
    </nav>
  );
};

export default Navbar;