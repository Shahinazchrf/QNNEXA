// frontend/src/pages/SuperAdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SuperAdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await authService.login(email, password);
    
    if (response.success) {
      const user = response.user;
      
      // Vérifier si c'est un super admin
      if (user.role === 'super_admin') {
        // Sauvegarde manuelle du token
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (onLogin) {
          onLogin(user);
        }
        navigate('/superadmin');
      } else {
        setError('This account does not have super admin privileges');
        authService.logout();
      }
    } else {
      setError(response.error || 'Invalid email or password');
    }
  } catch (err) {
    setError('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B2E59 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Barre de couleur en haut */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #D71920, #0B2E59)'
        }}></div>

        {/* Logo / Titre */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            color: '#0B2E59',
            margin: 0,
            fontWeight: '800',
            letterSpacing: '2px'
          }}>
            AGB
          </h1>
          <h2 style={{
            fontSize: '24px',
            color: '#D71920',
            margin: '5px 0',
            fontWeight: '600'
          }}>
            QONNEXA
          </h2>
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginTop: '15px',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '30px',
            display: 'inline-block'
          }}>
            👑 SUPER ADMIN PORTAL
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#0B2E59',
              fontWeight: '600',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s',
                background: '#f8f9fa'
              }}
              placeholder="super@bank.com"
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#0B2E59',
              fontWeight: '600',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s',
                background: '#f8f9fa'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#D71920',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              borderLeft: '4px solid #D71920'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: '#D71920',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'CONNEXION...' : 'SE CONNECTER'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ fontWeight: '700', color: '#0B2E59', marginBottom: '8px' }}>
            🔐 Accès Super Admin
          </p>
          <p style={{
            margin: '5px 0',
            fontFamily: 'monospace',
            background: 'white',
            padding: '8px',
            borderRadius: '6px',
            border: '1px dashed #0B2E59'
          }}>
            super@bank.com /superadmin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;