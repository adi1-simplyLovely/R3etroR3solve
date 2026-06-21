import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkforceWindow from './WorkforceWindow';
import AdminDeletionsWindow from './AdminDeletionsWindow';
import { getUserFromToken, requestDeletion, deleteAdminSelf, logout as apiLogout } from '../api';
import ProfileCard from './ProfileCard';
import Minesweeper from './Minesweeper';

export default function Taskbar({ 
  onLogout, 
  workspaceName, 
  isMinimized, 
  setIsMinimized 
}) {
  const navigate = useNavigate();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Apps state
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notepadText, setNotepadText] = useState(localStorage.getItem('notepad_data') || '');
  
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState(['C:\\> Type "help" for commands']);
  const [terminalInput, setTerminalInput] = useState('');
  
  const [minesweeperOpen, setMinesweeperOpen] = useState(false);

  // New features
  const [workforceOpen, setWorkforceOpen] = useState(false);
  const [adminDeletionsOpen, setAdminDeletionsOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(true); // Open by default as requested

  const currentUser = getUserFromToken();
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  // Easter Eggs & Features
  const [clippyOpen, setClippyOpen] = useState(false);
  const [clippyMessage, setClippyMessage] = useState("It looks like you're trying to resolve a ticket. Would you like to play Minesweeper instead?");
  const [shuttingDown, setShuttingDown] = useState(false);
  
  const [runawayPos, setRunawayPos] = useState({ left: 0 });
  const [turboMode, setTurboMode] = useState(false);
  const [workforceCount, setWorkforceCount] = useState({ active: 0, total: 0 });

  useEffect(() => {
    const fetchWorkforce = () => {
      import('../api').then(({ getWorkforce }) => {
        getWorkforce().then(users => {
          const active = users.filter(u => u.isActive).length;
          setWorkforceCount({ active, total: users.length });
        }).catch(e => console.error("Taskbar workforce fetch failed", e));
      });
    };
    
    fetchWorkforce();
    const interval = setInterval(fetchWorkforce, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set turbo mode globally for the agent dashboard to use if needed
  useEffect(() => {
    window.turboModeActive = turboMode;
  }, [turboMode]);

  // Handle outside clicks to close start menu
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.start-menu-container') && !e.target.closest('.start-button')) {
        setStartMenuOpen(false);
        setProgramsOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const changeTheme = (themeClass) => {
    document.body.className = themeClass;
    setStartMenuOpen(false);
    setSettingsOpen(false);
  };

  const handleShutDown = () => {
    setStartMenuOpen(false);
    setShuttingDown(true);
    
    // CRT animation
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'white';
    overlay.style.zIndex = '9999';
    overlay.style.transition = 'all 0.5s ease-in-out';
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.transform = 'scaleY(0.01)';
      setTimeout(() => {
        overlay.style.transform = 'scaleY(0.01) scaleX(0)';
        setTimeout(() => {
          overlay.style.backgroundColor = 'black';
          setTimeout(async () => {
            document.body.removeChild(overlay);
            await apiLogout();
            onLogout();
            window.location.reload();
          }, 500);
        }, 500);
      }, 500);
    }, 100);
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    const newHistory = [...terminalHistory, `C:\\> ${terminalInput}`];
    
    if (cmd === 'help') {
      newHistory.push('Available commands: help, ping, dir, clear, exit');
    } else if (cmd === 'ping') {
      newHistory.push('Pinging 127.0.0.1 with 32 bytes of data:');
      newHistory.push('Reply from 127.0.0.1: bytes=32 time<1ms TTL=128');
    } else if (cmd === 'dir') {
      newHistory.push(' Volume in drive C has no label.');
      newHistory.push(' Directory of C:\\HELPDESK');
      newHistory.push(' 06/20/2026  10:00 AM    <DIR>          .');
      newHistory.push(' 06/20/2026  10:00 AM    <DIR>          ..');
      newHistory.push(' 06/20/2026  10:05 AM             1,024 secret_passwords.txt');
    } else if (cmd === 'clear') {
      setTerminalHistory(['C:\\> ']);
      setTerminalInput('');
      return;
    } else if (cmd === 'exit') {
      setTerminalOpen(false);
      setTerminalInput('');
      return;
    } else if (cmd !== '') {
      newHistory.push(`'${cmd}' is not recognized as an internal or external command.`);
    }
    
    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

  const handleStartHover = () => {
    // 5% chance the button runs away
    if (Math.random() < 0.05 && runawayPos.left === 0) {
      setRunawayPos({ left: 300 });
      setTimeout(() => setRunawayPos({ left: 0 }), 2000); // comes back after 2s
    }
  };

  const clippyMessages = [
    "It looks like you're trying to resolve a ticket. Would you like to play Minesweeper instead?",
    "Did you know? Turning the computer off and on again fixes 99% of issues.",
    "I see you're using the Helpdesk. Remember: user error is a feature!",
    "Turbo mode is OFF. Clicking the blinking light in the corner will make animations 10x faster!",
    "Save your notes in Notepad! It actually persists in localStorage."
  ];

  const cycleClippy = () => {
    setClippyMessage(clippyMessages[Math.floor(Math.random() * clippyMessages.length)]);
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm("Are you sure you want to request account deletion?")) return;
    try {
      if (isAdmin) {
        await deleteAdminSelf();
        alert("Admin account deleted.");
        handleShutDown();
      } else {
        await requestDeletion();
        alert("Deletion request sent to Admin.");
      }
    } catch (e) {
      alert("Action failed.");
    }
  };

  return (
    <>
      {/* --- START MENU POPUP --- */}
      {startMenuOpen && (
        <div className="start-menu-container window" style={{
          position: 'fixed',
          bottom: '40px',
          left: '0',
          width: '200px',
          display: 'flex',
          flexDirection: 'row',
          zIndex: 2001,
          padding: '2px'
        }}>
          {/* Vertical Banner */}
          <div style={{ width: '30px', background: '#000080', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5px' }}>
            <span style={{ color: 'white', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '16px' }}>
              Windows 95
            </span>
          </div>
          
          {/* Menu Items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#c0c0c0' }}>
            
            {/* Programs Menu Item */}
            <div 
              style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: programsOpen ? '#000080' : 'transparent', color: programsOpen ? 'white' : 'black' }}
              onMouseEnter={() => { setProgramsOpen(true); setSettingsOpen(false); }}
            >
              <span><u>P</u>rograms</span>
              <span>►</span>
            </div>

            {/* Settings Menu Item */}
            <div 
              style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: settingsOpen ? '#000080' : 'transparent', color: settingsOpen ? 'white' : 'black' }}
              onMouseEnter={() => { setSettingsOpen(true); setProgramsOpen(false); }}
            >
              <span><u>S</u>ettings</span>
              <span>►</span>
            </div>

            <div style={{ height: '1px', background: '#808080', borderBottom: '1px solid white', margin: '4px 0' }}></div>

            {/* Shut Down Menu Item */}
            <div 
              style={{ padding: '8px 10px', cursor: 'pointer' }}
              onMouseEnter={() => { setProgramsOpen(false); setSettingsOpen(false); }}
              onClick={handleShutDown}
            >
              <span><u>S</u>hut Down...</span>
            </div>
          </div>
        </div>
      )}

      {/* --- PROGRAMS NESTED MENU --- */}
      {startMenuOpen && programsOpen && (
        <div className="window" style={{
          position: 'fixed',
          bottom: '100px',
          left: '200px',
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2002
        }}>
          <div className="menu-item" style={{ padding: '8px' }} onClick={() => { setNotepadOpen(true); setStartMenuOpen(false); }}>📝 Notepad</div>
          <div className="menu-item" style={{ padding: '8px' }} onClick={() => { setTerminalOpen(true); setStartMenuOpen(false); }}>💻 MS-DOS Prompt</div>
          <div className="menu-item" style={{ padding: '8px' }} onClick={() => { setMinesweeperOpen(true); setStartMenuOpen(false); }}>💣 Minesweeper</div>
          <div style={{ height: '1px', background: '#808080', borderBottom: '1px solid white', margin: '4px 0' }}></div>
          <div className="menu-item" style={{ padding: '8px', color: 'blue' }} onClick={() => { setWorkforceOpen(true); setStartMenuOpen(false); }}>👥 Colleagues / Workforce</div>
          {isAdmin && (
            <div className="menu-item" style={{ padding: '8px', color: 'red' }} onClick={() => { setAdminDeletionsOpen(true); setStartMenuOpen(false); }}>🛡️ Admin: Deletions</div>
          )}
        </div>
      )}

      {/* --- SETTINGS NESTED MENU --- */}
      {startMenuOpen && settingsOpen && (
        <div className="window" style={{
          position: 'fixed',
          bottom: '70px',
          left: '200px',
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2002
        }}>
          <div className="menu-item" style={{ padding: '8px', fontWeight: document.body.className === '' ? 'bold' : 'normal' }} onClick={() => changeTheme('')}>Teal (Default)</div>
          <div className="menu-item" style={{ padding: '8px', fontWeight: document.body.className === 'theme-hotdog' ? 'bold' : 'normal' }} onClick={() => changeTheme('theme-hotdog')}>Hotdog Stand</div>
          <div className="menu-item" style={{ padding: '8px', fontWeight: document.body.className === 'theme-matrix' ? 'bold' : 'normal' }} onClick={() => changeTheme('theme-matrix')}>The Matrix</div>
          <div style={{ height: '1px', background: '#808080', borderBottom: '1px solid white', margin: '4px 0' }}></div>
          <div className="menu-item" style={{ padding: '8px', color: 'red' }} onClick={() => { handleRequestDeletion(); setStartMenuOpen(false); }}>🗑️ Request Account Deletion</div>
        </div>
      )}

      {/* --- MINI APPS WINDOWS --- */}
      
      {workforceOpen && <WorkforceWindow onClose={() => setWorkforceOpen(false)} />}
      {adminDeletionsOpen && <AdminDeletionsWindow onClose={() => setAdminDeletionsOpen(false)} />}
      {profileCardOpen && <ProfileCard onClose={() => setProfileCardOpen(false)} />}
      
      {/* NOTEPAD */}
      {notepadOpen && (
        <div className="window" style={{ position: 'fixed', top: '100px', left: '100px', width: '300px', height: '250px', zIndex: 1500, display: 'flex', flexDirection: 'column', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
          <div className="title-bar">
            <span>Notepad - Untitled</span>
            <button className="btn" onClick={() => setNotepadOpen(false)} style={{ padding: '0 4px' }}>X</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '2px 5px', fontSize: '12px', background: 'var(--bg-window)' }}>
            <span>File</span><span>Edit</span><span>Search</span><span>Help</span>
          </div>
          <textarea 
            style={{ flex: 1, resize: 'none', border: 'none', padding: '5px', outline: 'none', fontFamily: 'monospace' }}
            value={notepadText}
            onChange={(e) => {
              setNotepadText(e.target.value);
              localStorage.setItem('notepad_data', e.target.value);
            }}
          />
        </div>
      )}

      {/* TERMINAL */}
      {terminalOpen && (
        <div className="window" style={{ position: 'fixed', top: '150px', left: '150px', width: '400px', height: '250px', zIndex: 1500, display: 'flex', flexDirection: 'column', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', background: 'black' }}>
          <div className="title-bar" style={{ background: '#000080' }}>
            <span>MS-DOS Prompt</span>
            <button className="btn" onClick={() => setTerminalOpen(false)} style={{ padding: '0 4px', color: 'black' }}>X</button>
          </div>
          <div style={{ flex: 1, padding: '5px', color: '#c0c0c0', fontFamily: 'monospace', fontSize: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {terminalHistory.map((line, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>
            ))}
            <form onSubmit={handleTerminalSubmit} style={{ display: 'flex', marginTop: '5px' }}>
              <span>C:\&gt;&nbsp;</span>
              <input 
                type="text" 
                autoFocus
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#c0c0c0', outline: 'none', flex: 1, fontFamily: 'monospace', fontSize: '14px' }}
              />
            </form>
          </div>
        </div>
      )}

      {/* MINESWEEPER */}
      {minesweeperOpen && <Minesweeper onClose={() => setMinesweeperOpen(false)} />}

      {/* CLIPPY ASSISTANT */}
      {clippyOpen && (
        <div style={{ position: 'fixed', bottom: '60px', right: '10px', zIndex: 2500, display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div className="window" style={{ background: '#ffffe0', borderRadius: '10px', padding: '10px', maxWidth: '200px', position: 'relative', border: '1px solid black', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>{clippyMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
              <button className="btn" onClick={cycleClippy} style={{ fontSize: '10px', padding: '2px 4px' }}>Next Tip</button>
            </div>
            {/* Speech bubble pointer */}
            <div style={{ position: 'absolute', bottom: '-10px', right: '20px', width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid black' }}></div>
            <div style={{ position: 'absolute', bottom: '-8px', right: '21px', width: '0', height: '0', borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '9px solid #ffffe0' }}></div>
          </div>
          <div 
            style={{ width: '40px', height: '60px', background: 'silver', borderRadius: '20px', border: '2px solid black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            onClick={() => setClippyOpen(false)}
            title="Click to dismiss Clippy"
          >
            {/* Fake paperclip eyes */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '-15px' }}>
              <div style={{ width: '6px', height: '8px', background: 'white', border: '1px solid black', borderRadius: '50%' }}><div style={{ width: '3px', height: '3px', background: 'black', borderRadius: '50%', marginTop: '2px', marginLeft: '1px' }}></div></div>
              <div style={{ width: '6px', height: '8px', background: 'white', border: '1px solid black', borderRadius: '50%' }}><div style={{ width: '3px', height: '3px', background: 'black', borderRadius: '50%', marginTop: '2px', marginLeft: '1px' }}></div></div>
            </div>
            <div style={{ position: 'absolute', bottom: '5px', fontSize: '9px', fontWeight: 'bold' }}>X</div>
          </div>
        </div>
      )}

      {/* --- TASKBAR BOTTOM --- */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, left: 0, right: 0, 
        height: '40px', 
        backgroundColor: 'var(--bg-window)', 
        borderTop: '2px solid var(--border-light)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 5px',
        gap: '5px',
        zIndex: 2000
      }}>
        <button 
          className="btn start-button" 
          style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative', left: `${runawayPos.left}px`, transition: runawayPos.left > 0 ? 'left 0.1s' : 'left 0s' }}
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          onMouseEnter={handleStartHover}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" style={{ opacity: 0.8 }}>
            <path d="M0,3 L9,1.5 L9,9 L0,9 Z M10,1 L20,0 L20,9 L10,9 Z M0,10 L9,10 L9,17.5 L0,16 Z M10,10 L20,10 L20,20 L10,18 Z" fill="black"/>
          </svg>
          Start
        </button>
        
        <div style={{ borderLeft: '2px inset var(--border-dark)', height: '80%', margin: '0 5px' }}></div>
        
        {isMinimized && (
          <button className="btn" onClick={() => setIsMinimized(false)} style={{ padding: '4px 20px', fontWeight: 'bold', background: 'var(--border-mid)' }}>
            [ {workspaceName} ]
          </button>
        )}

        <div style={{ flex: 1 }}></div>

        {/* System Tray (God Mode) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '2px inset var(--border-dark)', padding: '2px 10px', height: '80%' }}>
          {/* Turbo Mode Toggle */}
          <div 
            onClick={() => setTurboMode(!turboMode)}
            style={{ width: '12px', height: '12px', borderRadius: '50%', background: turboMode ? '#00ff00' : '#005500', boxShadow: turboMode ? '0 0 5px #00ff00' : 'none', cursor: 'pointer', border: '1px solid black' }}
            title={`Sysadmin Turbo Mode: ${turboMode ? 'ON' : 'OFF'}`}
          ></div>
          
          {/* Summon Clippy */}
          <div 
            onClick={() => setClippyOpen(true)}
            style={{ cursor: 'pointer', fontSize: '14px' }}
            title="Summon Assistant"
          >
            📎
          </div>

          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginLeft: '5px', cursor: 'pointer' }} onClick={() => setWorkforceOpen(true)} title="Workforce Roster">
            <span style={{ fontSize: '12px' }}>👥 {workforceCount.active}/{workforceCount.total}</span>
          </div>

          <button className="btn" style={{ fontSize: '12px', padding: '0px 5px', fontWeight: 'bold' }} onClick={() => setProfileCardOpen(!profileCardOpen)} title="View Current User Identification">
            [ My Identity ]
          </button>

          <span style={{ fontSize: '12px', marginLeft: '5px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </>
  );
}
