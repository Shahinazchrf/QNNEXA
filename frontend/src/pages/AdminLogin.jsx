import React, { useState } from 'react';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Admins de test
  const admins = [
    { id: 1, username: 'admin1', password: '1234', name: 'Admin Principal' },
  
    { id: 3, username: 'super', password: '1234', name: 'Super Admin' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const admin = admins.find(
      a => a.username === username && a.password === password
    );

    if (admin) {
      setError('');
      onLogin(admin);
    } else {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
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
            style={{
              width: '100%',
              background: '#D71920',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            SE CONNECTER
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
          <div>admin1 / 1234 - Admin Principal</div>
          
          <div>super / 1234 - Super Admin</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
