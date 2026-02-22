import React, { useState } from 'react';

const SupportChat = ({ onBack }) => {
  const [message, setMessage] = useState('');

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F5F7FA', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      
      {/* Header */}
      <div style={{ 
        background: '#0B2E59', 
        color: 'white', 
        padding: '30px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>QONNEXA Support</h1>
        <p style={{ fontSize: '16px', opacity: '0.9' }}>How can we help you today?</p>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '20px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {/* Bot Message */}
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: '#E0E0E0', 
            borderRadius: '50%', 
            marginRight: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              background: 'white', 
              padding: '15px', 
              borderRadius: '12px', 
              borderTopLeftRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.5', marginBottom: '10px' }}>
                Hello! I'm your QONNEXA virtual assistant. How can I help you with your queue management today?
              </p>
              <p style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>8:30 PM</p>
            </div>
          </div>
        </div>

        {/* Quick Options Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '10px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          {[
            'Check my position',
            'Estimated wait time',
            'Cancel ticket',
            'New ticket',
            'Services',
            'Contact'
          ].map((option, index) => (
            <button
              key={index}
              style={{
                background: 'white',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                color: '#0B2E59',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ 
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          padding: '10px',
          marginTop: '20px'
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              border: 'none',
              padding: '10px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button style={{
            background: '#0B2E59',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Send
          </button>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', 
            color: '#D71920', 
            border: 'none', 
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '20px',
            textDecoration: 'underline',
            display: 'block',
            textAlign: 'center',
            width: '100%'
          }}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
};

export default SupportChat;
