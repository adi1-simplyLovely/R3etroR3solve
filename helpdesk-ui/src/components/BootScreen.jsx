import React, { useState, useEffect } from 'react';

export default function BootScreen({ onComplete }) {
  const [lines, setLines] = useState([]);
  
  const bootSequence = [
    "Starting HELPDESK OS...",
    "BIOS Date 06/21/26 15:30:00 Ver 1.0",
    "CPU: HELPDESK Processor, Speed: 133 MHz",
    "Checking RAM...",
    "640K Base Memory OK",
    "16384K Extended Memory OK",
    "Initializing Network...",
    "Loading STOMP Websocket driver...",
    "Network OK.",
    "Loading AI Subsystems...",
    "Groq Copilot API OK.",
    "Mounting UI Components...",
    "System Boot Complete.",
    "Starting desktop environment..."
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setLines(prev => [...prev, bootSequence[index]]);
      index++;
      if (index === bootSequence.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800); // Wait a bit before completing
      }
    }, 150); // fast typing effect

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'black', color: '#0f0', fontFamily: 'monospace',
      padding: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '5px'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        HELPDESK OS BIOS v1.0
      </div>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
      <div className="blink-cursor" style={{ marginTop: '10px', width: '10px', height: '18px', background: '#0f0' }}></div>
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        .blink-cursor { animation: blink 1s step-end infinite; }
      `}</style>
    </div>
  );
}
