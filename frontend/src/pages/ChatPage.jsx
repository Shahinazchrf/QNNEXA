// src/pages/ChatPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './ChatPage.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I\'m your QONNEXEA virtual assistant. How can I help you with your queue management today?',
      time: '8:30 PM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickActions = [
    'Check my position',
    'Estimated wait time',
    'Cancel ticket',
    'New ticket',
    'Services',
    'Contact'
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, userMessage]);
    setInputMessage('');

    // Simuler une réponse du bot
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: 'Thank you for your message. A support agent will assist you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: action,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, userMessage]);

    // Réponse du bot selon l'action
    setTimeout(() => {
      let response = '';
      switch(action) {
        case 'Check my position':
          response = 'Your current position is #18. There are 5 people ahead of you.';
          break;
        case 'Estimated wait time':
          response = 'Estimated wait time is 20 minutes.';
          break;
        case 'Cancel ticket':
          response = 'To cancel your ticket, please visit any branch or call our support.';
          break;
        case 'New ticket':
          response = 'You can create a new ticket from the "Get New Ticket" button.';
          break;
        case 'Services':
          response = 'We offer: Cash Operations, Account Management, Loans, Cards, and more.';
          break;
        case 'Contact':
          response = 'You can reach us at: support@agb.dz or call 1530.';
          break;
        default:
          response = 'How can I help you?';
      }
      
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  return (
    <div className="chat-page">
      <Navbar />
      
      <div className="chat-container">
        <div className="chat-header">
          <h1>QONNEXEA Support</h1>
          <p>How can we help you today?</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="message-avatar">🤖</div>
              )}
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-btn" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;