import React, { useState, useRef, useEffect } from 'react';
import { getCopilotResponse } from '../api';

import { Rnd } from 'react-rnd';

export default function ClippyCopilot({ contextData }) {
// ... existing state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'clippy', text: "Hi! I'm your AI Copilot. Need help resolving a ticket?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-copilot', handleOpen);
    return () => window.removeEventListener('open-copilot', handleOpen);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'agent', text: userMessage }]);
    setLoading(true);

    try {
      const response = await getCopilotResponse(userMessage, contextData || "No ticket selected.");
      setMessages(prev => [...prev, { sender: 'clippy', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'clippy', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div 
        style={{ position: 'fixed', bottom: '60px', right: '20px', cursor: 'pointer', zIndex: 9999 }}
        onClick={() => setIsOpen(true)}
        title="Open AI Copilot"
      >
        <div style={{ fontSize: '40px', filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))' }}>📎</div>
        <div style={{ background: '#ffffe0', border: '1px solid black', padding: '2px 5px', fontSize: '10px', position: 'absolute', top: '-15px', right: '10px', whiteSpace: 'nowrap' }}>
          Need AI Help?
        </div>
      </div>
    );
  }

  return (
    <Rnd
      default={{
        x: window.innerWidth - 320,
        y: window.innerHeight - 460,
        width: 300,
        height: 400
      }}
      minWidth={250}
      minHeight={300}
      bounds="window"
      dragHandleClassName="title-bar"
      style={{ zIndex: 9999 }}
    >
      <div className="window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
        <div className="title-bar" style={{ background: '#000080', cursor: 'move' }}>
          <span style={{ fontWeight: 'bold' }}>📎 Clippy AI Copilot</span>
          <button className="btn" style={{ padding: '0 4px', fontWeight: 'bold' }} onClick={() => setIsOpen(false)}>X</button>
        </div>

        <div style={{ flex: 1, padding: '10px', background: '#fff', border: '2px inset #dfdfdf', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ textAlign: msg.sender === 'agent' ? 'right' : 'left' }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '5px 8px', 
                background: msg.sender === 'agent' ? '#d0e0ff' : '#ffffe0',
                border: '1px solid #808080',
                borderRadius: '4px',
                maxWidth: '85%',
                fontSize: '12px',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>{msg.sender === 'agent' ? 'You' : 'Clippy'}:</strong><br/>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'left', fontSize: '12px', fontStyle: 'italic', color: '#808080' }}>
              Clippy is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '5px', padding: '5px', background: '#dfdfdf' }}>
          <input 
            ref={inputRef}
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Clippy..." 
            className="input-field" 
            style={{ flex: 1, fontSize: '12px' }}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="btn" disabled={loading || !input.trim()}>Send</button>
        </form>
      </div>
    </Rnd>
  );
}
