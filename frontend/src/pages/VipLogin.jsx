import React, { useState } from 'react';

const VipLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Mock VIP users
  const vipUsers = [
    { id: 1, email: 'vip1@agb.dz', password: '1234', name: 'Ahmed VIP', phone: '0555123456' },
    { id: 2, email: 'vip2@agb.dz', password: '1234', name: 'Fatima VIP', phone: '0666123456' },
    { id: 3, email: 'vip3@agb.dz', password: '1234', name: 'Karim VIP', phone: '0777123456' },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const user = vipUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Create new VIP user (mock)
    const newUser = {
      id: vipUsers.length + 1,
      email: registerData.email,
      password: registerData.password,
      name: registerData.name,
      phone: registerData.phone
    };
    
    alert(`VIP account created for ${registerData.name}. You can now login.`);
    setIsRegistering(false);
    setEmail(registerData.email);
    setPassword('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  if (isRegistering) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0B2E59 0%, #1E5AA8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '15px', padding: '40px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          
          <h1 style={{ fontSize: '32px', color: '#0B2E59', textAlign: 'center', marginBottom: '10px' }}>⭐ VIP Registration</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Create your VIP account</p>
          
          <form onSubmit={handleRegister}>
            <input type="text" name="name" placeholder="Full Name" value={registerData.name} onChange={handleRegisterChange} required style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
            <input type="email" name="email" placeholder="Email" value={registerData.email} onChange={handleRegisterChange} required style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
            <input type="tel" name="phone" placeholder="Phone Number" value={registerData.phone} onChange={handleRegisterChange} required style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
            <input type="password" name="password" placeholder="Password" value={registerData.password} onChange={handleRegisterChange} required style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={registerData.confirmPassword} onChange={handleRegisterChange} required style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
            
            {error && <p style={{ color: '#D71920', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#D71920', color: 'white', padding: '14px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
              REGISTER
            </button>
            
            <button type="button" onClick={() => setIsRegistering(false)} style={{ width: '100%', background: 'none', color: '#0B2E59', border: '1px solid #0B2E59', padding: '12px', borderRadius: '5px', cursor: 'pointer' }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0B2E59 0%, #1E5AA8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '15px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#0B2E59', marginBottom: '5px' }}>AGB</h1>
          <p style={{ color: '#D71920', fontSize: '16px', fontWeight: 'bold' }}>⭐ VIP ACCESS</p>
        </div>

        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #E0E0E0', borderRadius: '5px' }} />
          
          {error && <p style={{ color: '#D71920', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
          
          <button type="submit" style={{ width: '100%', background: '#0B2E59', color: 'white', padding: '14px', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
            LOGIN
          </button>
          
          <button type="button" onClick={() => setIsRegistering(true)} style={{ width: '100%', background: 'none', color: '#D71920', border: '1px solid #D71920', padding: '12px', borderRadius: '5px', cursor: 'pointer' }}>
            CREATE VIP ACCOUNT
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#999' }}>
          Test accounts: vip1@agb.dz / 1234
        </p>
      </div>
    </div>
  );
};

export default VipLogin;