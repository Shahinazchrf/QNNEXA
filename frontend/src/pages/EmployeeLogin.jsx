import React, { useState } from 'react';

const EmployeeLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Liste des employés (simulée)
  const employees = [
    { id: 1, username: 'guichetier1', password: '1234', name: 'Ahmed', counter: '#1', service: 'Cash Operations' },
    { id: 2, username: 'guichetier2', password: '1234', name: 'Fatima', counter: '#2', service: 'Customer Service' },
    { id: 3, username: 'guichetier3', password: '1234', name: 'Karim', counter: '#3', service: 'Cards & Payments' },
    { id: 4, username: 'guichetier4', password: '1234', name: 'Leila', counter: '#4', service: 'Corporate VIP' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const employee = employees.find(
      emp => emp.username === username && emp.password === password
    );

    if (employee) {
      setError('');
      onLogin(employee);
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
      
      {/* Carte de connexion */}
      <div style={{ 
        background: 'white', 
        borderRadius: '15px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        
        {/* Logo AGB */}
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
          <p style={{ color: '#666', fontSize: '14px' }}>Espace Guichetier</p>
        </div>

        {/* Formulaire */}
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
                outline: 'none',
                transition: 'border-color 0.2s'
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
                outline: 'none',
                transition: 'border-color 0.2s'
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
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            SE CONNECTER
          </button>
        </form>

        {/* Liste des comptes (pour test) */}
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          background: '#F5F5F5', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Comptes de test :</p>
          {employees.map(emp => (
            <div key={emp.id} style={{ marginBottom: '5px' }}>
              {emp.counter} - {emp.name} ({emp.service}) : <span style={{ color: '#0B2E59' }}>{emp.username} / 1234</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;