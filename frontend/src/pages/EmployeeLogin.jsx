// frontend/src/pages/EmployeeLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './EmployeeLogin.css';

const EmployeeLogin = ({ onLogin }) => {  // ← Add onLogin prop here
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
        
        // Check if user is employee or admin
        if (['employee', 'admin', 'super_admin'].includes(user.role)) {
          // Call onLogin if it exists (for the /employee route)
          if (onLogin) {
            onLogin(user);
          }
          navigate('/employee');
        } else {
          setError('This account does not have employee privileges');
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
    <div className="employee-login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>AGB</h1>
          <h2>QONNEXA</h2>
          <p>Employee Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@bank.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials:</p>
          <p>employee@bank.com / employee123</p>
          <p>admin@bank.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;