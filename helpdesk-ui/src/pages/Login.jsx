import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export default function Login() {
  const navigate = useNavigate();
  
  // Entry Flow States
  const [isSlidUp, setIsSlidUp] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  
  const [dosResolved, setDosResolved] = useState(false);
  const [dosInput, setDosInput] = useState('');
  const dosInputRef = useRef(null);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Focus management for DOS prompt
  useEffect(() => {
    if (isSlidUp && !dosResolved && dosInputRef.current) {
      dosInputRef.current.focus();
    }
  }, [isSlidUp, dosResolved]);

  // --- Slide Drag Logic ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    startY.current = e.clientY || e.touches?.[0].clientY;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isSlidUp) return;
    const currentY = e.clientY || e.touches?.[0].clientY;
    const diff = currentY - startY.current;
    if (diff < 0) {
      setSlideOffset(diff); // dragging up
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || isSlidUp) return;
    setIsDragging(false);
    if (slideOffset < -150) { // Threshold to snap open
      setIsSlidUp(true);
      setSlideOffset(-window.innerHeight);
    } else {
      setSlideOffset(0); // Snap back down
    }
  };

  // --- DOS Prompt Logic ---
  const handleDosKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = dosInput.trim().toUpperCase();
      if (val === 'Y') {
        navigate('/register');
      } else if (val === 'N') {
        setDosResolved(true);
      } else {
        setDosInput('');
      }
    }
  };

  // --- Login Form Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = await login({ email, password });
      import('../utils/sounds').then(m => m.playBootSound && m.playBootSound());
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (userData.role === 'SUPPORT_AGENT' || userData.role === 'ADMIN') {
        navigate('/agent-workspace');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: dosResolved ? 'var(--bg-desktop)' : '#000' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >

      {/* STAGE 3: Actual Login Form */}
      {dosResolved && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
          <div className="window" style={{ width: '100%', maxWidth: '350px' }}>
            <div className="title-bar">
              <span>System Login</span>
              <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
            </div>
            <div style={{ padding: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <div style={{ fontSize: '32px', padding: '5px' }}>[ ! ]</div>
                <div>
                  <h2 style={{ fontSize: '16px', margin: 0 }}>Welcome to Helpdesk</h2>
                  <p style={{ margin: 0, fontSize: '12px' }}>Please enter your credentials.</p>
                </div>
              </div>

              {error && (
                <div style={{ background: '#ff0000', color: '#fff', padding: '5px', marginBottom: '15px', fontWeight: 'bold', wordBreak: 'break-word' }}>
                  ERROR: {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <fieldset>
                  <legend>Authentication</legend>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '3px' }}>Email:</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '3px' }}>Password:</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </fieldset>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <div style={{ fontSize: '12px' }}>
                    <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: '#000' }}>Create Account</a>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn" disabled={loading}>
                      {loading ? 'Wait...' : 'OK'}
                    </button>
                    <button type="button" className="btn" onClick={() => { setEmail(''); setPassword(''); }}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {loading && !error && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
              <div className="window" style={{ width: '300px', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                <div className="title-bar">
                  <span>Authenticating...</span>
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 'bold' }}>Connecting to mainframe...</p>
                  <div style={{ width: '100%', height: '15px', border: '2px inset #dfdfdf', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '50%', background: '#000080', animation: 'load 1.5s infinite linear' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: DOS Prompt (Visible when slid up, before DOS is resolved) */}
      {isSlidUp && !dosResolved && (
        <div 
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            background: '#000', color: '#0f0', fontFamily: '"Courier New", Courier, monospace',
            padding: '40px', fontSize: '24px', display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box'
          }}
          onClick={() => dosInputRef.current?.focus()}
        >
          <div>MAINFRAME TERMINAL v9.5</div>
          <div>ESTABLISHING SECURE CONNECTION... OK.</div>
          <br/>
          <div>NEW USER? PRESS [Y] TO REGISTER. ELSE PRESS [N] TO LOGIN.</div>
          <div style={{ display: 'flex', marginTop: '10px', alignItems: 'center', position: 'relative' }}>
            <span>{`C:\\>`}</span>
            <span style={{ marginLeft: '10px', textTransform: 'uppercase' }}>{dosInput}</span>
            
            {/* Blinking block cursor */}
            <span style={{ 
              display: 'inline-block', width: '14px', height: '24px', background: '#0f0', 
              animation: 'blink 1s step-end infinite', marginLeft: dosInput ? '2px' : '10px'
            }}></span>

            <input 
              ref={dosInputRef}
              type="text" 
              value={dosInput}
              onChange={e => setDosInput(e.target.value)}
              onKeyDown={handleDosKeyDown}
              maxLength={1}
              autoFocus
              style={{ 
                position: 'absolute', opacity: 0, pointerEvents: 'none'
              }}
            />
          </div>
          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* STAGE 1: Draggable Cover Screen (Technical Blueprint Style) */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: '#000005', // Deep black background
          color: '#0ff', // Cyan text/borders
          fontFamily: '"Courier New", Courier, monospace',
          display: 'flex', flexDirection: 'column', 
          transition: isDragging ? 'none' : 'transform 0.4s ease-out',
          transform: isSlidUp ? 'translateY(-100%)' : `translateY(${slideOffset}px)`,
          zIndex: 50, cursor: isDragging ? 'grabbing' : 'grab',
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          flex: 1, border: '2px solid #0ff', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 10px rgba(0,255,255,0.3), inset 0 0 10px rgba(0,255,255,0.3)'
        }}>
          
          {/* TOP HEADER GRID */}
          <div style={{ display: 'flex', borderBottom: '2px solid #0ff', minHeight: '120px' }}>
            {/* Left box: Icon/Logo mark */}
            <div style={{ width: '120px', borderRight: '2px solid #0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', textShadow: '0 0 10px #0ff' }}>
              ⎔
            </div>
            
            {/* Middle box: Main Title */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', letterSpacing: '4px', marginBottom: '10px' }}>SECURE MAINFRAME ACCESS PORTAL</div>
              <div className="retro-logo" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', margin: 0, lineHeight: 1 }}>R3ETROR3SOLVE</div>
              <div style={{ fontSize: '14px', letterSpacing: '6px', marginTop: '10px' }}>ENTERPRISE HELPDESK SYSTEM</div>
            </div>
            
            {/* Right box: Status/Data */}
            <div style={{ width: '150px', borderLeft: '2px solid #0ff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '15px', fontSize: '12px', lineHeight: '2' }}>
              <div>NODE: ALPHA-9</div>
              <div>STATUS: ONLINE</div>
              <div>UPLINK: SECURE</div>
              <div style={{ animation: 'blink 1s step-end infinite' }}>AWAITING INPUT_</div>
            </div>
          </div>

          {/* SUB-HEADER MENU */}
          <div style={{ display: 'flex', borderBottom: '2px solid #0ff', height: '40px' }}>
            {['INITIALIZE', 'DIAGNOSTICS', 'PROTOCOLS', 'SYSTEM OVERRIDE'].map((text, i) => (
              <div key={i} style={{ flex: 1, borderRight: i < 3 ? '2px solid #0ff' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', letterSpacing: '2px', fontWeight: 'bold' }}>
                {text}
              </div>
            ))}
          </div>

          {/* CENTER PIECE (Replacing the bottle) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            
            {/* Crosshairs & Grid lines */}
            <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'rgba(0, 255, 255, 0.3)' }}></div>
            <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', background: 'rgba(0, 255, 255, 0.3)' }}></div>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', borderTop: '2px solid #0ff', borderLeft: '2px solid #0ff', width: '20px', height: '20px' }}></div>
            <div style={{ position: 'absolute', top: '20px', right: '20px', borderTop: '2px solid #0ff', borderRight: '2px solid #0ff', width: '20px', height: '20px' }}></div>
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', borderBottom: '2px solid #0ff', borderLeft: '2px solid #0ff', width: '20px', height: '20px' }}></div>
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', borderBottom: '2px solid #0ff', borderRight: '2px solid #0ff', width: '20px', height: '20px' }}></div>

            {/* ASCII Centerpiece */}
            <pre style={{ 
              fontSize: '12px', lineHeight: '12px', textAlign: 'center', color: '#0ff', opacity: 0.8,
              textShadow: '0 0 8px #0ff', userSelect: 'none'
            }}>
{`
       .-------.
      /       /|
     /_______/ |
     |  ...  | |
     |  :::  | |
     |_______|/
     [ DATA ]
`}
            </pre>
            
            <div style={{
                position: 'absolute', bottom: '15%', color: '#fff', fontFamily: '"Courier New", monospace',
                fontSize: '24px', animation: 'pulse 1.5s infinite', textAlign: 'center', userSelect: 'none',
                textShadow: '0 0 10px #0ff', background: '#000', padding: '10px 30px', border: '2px solid #0ff',
                boxShadow: '0 0 15px rgba(0,255,255,0.5)'
              }}>
                &#8593; DRAG UP TO INITIALIZE &#8593;
              </div>
          </div>

          {/* BOTTOM FOOTER GRID */}
          <div style={{ display: 'flex', borderTop: '2px solid #0ff', height: '40px' }}>
            <div style={{ flex: 2, borderRight: '2px solid #0ff', display: 'flex', alignItems: 'center', paddingLeft: '15px', fontSize: '12px', letterSpacing: '1px' }}>
              © 1995 R3ETRO CORP. ALL RIGHTS RESERVED.
            </div>
            <div style={{ flex: 1, borderRight: '2px solid #0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', letterSpacing: '1px' }}>
              VERSION 9.5.1
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', letterSpacing: '1px' }}>
              ENCRYPTION: 128-BIT
            </div>
          </div>
          
        </div>
        
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.4; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-10px); }
            100% { opacity: 0.4; transform: translateY(0); }
          }
        `}</style>
      </div>

    </div>
  );
}
