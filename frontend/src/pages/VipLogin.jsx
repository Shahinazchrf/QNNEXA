// frontend/src/pages/VipLogin.jsx

import React, { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const VipLogin = ({ onLogin }) => {
  //const navigate = useNavigate();
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
        console.log('🔍 User reçu:', user);
        if (response.success) {
  const user = response.user;
  
  console.log('🔍 USER COMPLET:', JSON.stringify(user, null, 2));
  console.log('🔍 is_vip:', user.is_vip);
  console.log('🔍 type is_vip:', typeof user.is_vip);
  console.log('🔍 role:', user.role);
  
  if (user.is_vip || user.role === 'vip_client') {
  onLogin(user);
  
} else {
  setError('This account does not have VIP privileges');
}
}
        
       if (user && (user.is_vip == 1 || user.is_vip === true || user.is_vip === '1' || user.role === 'vip_client')) {
  onLogin(user);
  
} else {
  setError('This account does not have VIP privileges');
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
          <p style={{ color: '#D71920', fontSize: '16px', fontWeight: 'bold' }}>⭐ VIP ACCESS</p>
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #E0E0E0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter your email"
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
              Password
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
              placeholder="Enter your password"
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
              background: '#0B2E59',
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
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#999' }}>
          VIP accounts: vip1@agb.dz / 1234
        </p>
      </div>
    </div>
  );
};

export default VipLogin;