// frontend/src/pages/AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For admin login, we use email field with username
      const email = username.includes('@') ? username : `${username}@bank.com`;
      
      const response = await authService.login(email, password);
      
      if (response.success) {
        const user = response.user;
        
        // Check if user is admin
        if (['admin', 'super_admin'].includes(user.role)) {
          onLogin(user);
        } else {
          setError('This account does not have admin privileges');
          authService.logout();
        }
      } else {
        setError(response.error || 'Invalid username or password');
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
      background: 'linear-gradient(135deg, #0B2E59 0%, #1E5AA8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      <div style={{ 
        background: 'white', 
        borderRadius: '15px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#0B2E59', 
            marginBottom: '5px',
            letterSpacing: '2px'
          }}>
            AGB
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Administration des guichets</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Entrez votre nom d'utilisateur"
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#333',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>

          {error && (
            <div style={{ 
              background: '#FFEBEE', 
              color: '#D71920', 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#D71920',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'CONNEXION...' : 'SE CONNECTER'}
          </button>
        </form>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          background: '#F5F5F5', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Comptes de test :</p>
          <div>admin@bank.com / admin123</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;