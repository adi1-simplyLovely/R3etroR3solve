import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { getAuthToken, clearAuthToken, getAllTickets, pickupTicket, resolveTicket, ignoreTicket, getUserFromToken, getCurrentUserApi } from '../api';
import { Rnd } from 'react-rnd';
import Taskbar from '../components/Taskbar';
import ChatSidebar from '../components/ChatSidebar';
import ClippyCopilot from '../components/ClippyCopilot';
import ProfileCard from '../components/ProfileCard';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const stompClient = useRef(null);
  
  const [isMinimized, setIsMinimized] = useState(false);

  const currentUser = getUserFromToken();
  const [displayUser, setDisplayUser] = useState(currentUser ? (currentUser.name || currentUser.sub) : 'Unknown User');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Workflow states
  const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState('');
  
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [ticketHistory, setTicketHistory] = useState([]);

  useEffect(() => {
    fetchTickets();
    getCurrentUserApi().then(user => {
      if (user && user.firstName) {
        setDisplayUser(`${user.firstName} ${user.lastName}`);
      }
    }).catch(console.error);
    
    const handleNewTicket = (e) => {
      const newTicket = e.detail;
      setTickets(prev => [newTicket, ...prev]);
      addToast(`New Ticket #${newTicket.id}: ${newTicket.title}`);
      import('../utils/sounds').then(m => m.playBootSound()); // or a new sound
    };

    window.addEventListener('new-ticket', handleNewTicket);
    return () => window.removeEventListener('new-ticket', handleNewTicket);
  }, [navigate]);

  useEffect(() => {
    let emoji = '👨‍💻';
    let titlePrefix = 'Agent Workspace';
    if (currentUser?.role === 'ROLE_ADMIN') {
      emoji = '👑';
      titlePrefix = 'Admin Workspace';
    } else if (currentUser?.role === 'ROLE_SUPPORT_AGENT') {
      emoji = '🛠️';
      titlePrefix = 'Agent Workspace';
    }
    document.title = `${emoji} ${displayUser} - ${titlePrefix}`;
  }, [displayUser, currentUser?.role]);

  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      if (err.message.includes('token') || err.message.includes('expire')) {
        clearAuthToken();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/');
  };

  const handlePickup = async (ticketId) => {
    try {
      await pickupTicket(ticketId);
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({...selectedTicket, status: 'IN_PROGRESS'});
      }
    } catch (err) {
      alert("Error picking up ticket: " + err.message);
    }
  };

  const handleIgnore = async (e) => {
    e.preventDefault();
    if (!ignoreReason.trim()) {
      alert("A valid reason is required to ignore a ticket.");
      return;
    }
    
    try {
      await ignoreTicket(selectedTicket.id, ignoreReason);
      setIgnoreModalOpen(false);
      setIgnoreReason('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert("Error ignoring ticket: " + err.message);
    }
  };

  const handleComplete = (ticketId) => {
    const resolutionNote = document.getElementById('resolutionNote')?.value || '';
    setProcessingModalOpen(true);
    setProgress(0);
    
    let currentProgress = 0;
    const intervalSpeed = window.turboModeActive ? 40 : 400; // 10x faster in turbo mode
    
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        try {
          await resolveTicket(ticketId, resolutionNote);
          setTimeout(() => {
            setProcessingModalOpen(false);
            setSelectedTicket(null);
            fetchTickets();
          }, 500);
        } catch (err) {
          setProcessingModalOpen(false);
          alert("Error resolving ticket: " + err.message);
        }
      }
      setProgress(currentProgress);
    }, intervalSpeed);
  };

  const handleViewHistory = async (ticketId) => {
    try {
      const { getTicketHistory } = await import('../api');
      const history = await getTicketHistory(ticketId);
      setTicketHistory(history || []);
      setHistoryModalOpen(true);
    } catch (err) {
      alert("Failed to fetch history: " + err.message);
    }
  };

  const activeTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_USER');
  const historyTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'IGNORED' || t.status === 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-desktop)', position: 'relative' }}>
      <div className="desktop-watermark retro-logo">R3ETROR3SOLVE</div>
      
      {!isMinimized && (
        <div style={{ display: 'flex', flex: 1, padding: '20px', paddingBottom: '60px', gap: '20px', position: 'relative', zIndex: 1 }}>
          
          {/* Real-time Global Chat Component */}
          <ChatSidebar />

          {/* Main Workspace Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Active Queue Window */}
            <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="title-bar" style={{ background: 'var(--bg-title)' }}>
                <span>{currentUser?.role === 'ADMIN' ? 'Admin Workspace' : 'Support Agent Workspace'} (Active Queue)</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }} onClick={() => setIsMinimized(true)}>_</button>
                  <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
                </div>
              </div>
              
              <div style={{ padding: '4px', background: '#dfdfdf', borderBottom: '2px solid var(--border-dark)', display: 'flex', gap: '5px' }}>
                <button className="btn" onClick={fetchTickets}>View &gt; Refresh Queue</button>
                <button className="btn" onClick={handleLogout}>System &gt; Logout</button>
              </div>

              <div style={{ padding: '15px', flex: 1, overflowY: 'auto', background: '#c0c0c0' }}>
                <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                  Pending Action Queue ({activeTickets.length} Tickets)
                </h3>
                
                {loading ? (
                  <p>Loading records from mainframe...</p>
                ) : activeTickets.length === 0 ? (
                  <div style={{ padding: '10px', background: '#fff', border: '2px inset #dfdfdf' }}>
                    <p style={{ margin: 0 }}>No active tickets in your department queue.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {activeTickets.map(ticket => (
                      <div key={ticket.id} className="window" style={{ background: '#dfdfdf' }}>
                        <div className="title-bar" style={{ background: ticket.status === 'IN_PROGRESS' ? '#008000' : '#000080' }}>
                          <span>#{ticket.id} - {ticket.title}</span>
                        </div>
                        <div style={{ padding: '10px' }}>
                          <div style={{ marginBottom: '5px', fontSize: '12px' }}>
                            <strong>Status:</strong> <span style={{ color: ticket.status === 'IN_PROGRESS' ? 'green' : 'black', fontWeight: 'bold' }}>{ticket.status}</span><br/>
                            <strong>Priority:</strong> {ticket.priority}<br/>
                            <strong>Category:</strong> {ticket.category}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={() => setSelectedTicket(ticket)}>Review &gt;&gt;</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* History Window */}
            <div className="window" style={{ height: '250px', display: 'flex', flexDirection: 'column' }}>
              <div className="title-bar" style={{ background: '#808080' }}>
                <span>Processed History Log</span>
              </div>
              <div style={{ padding: '10px', flex: 1, overflowY: 'auto', background: '#fff', border: '2px inset #dfdfdf', margin: '5px' }}>
                {historyTickets.length === 0 ? (
                  <p style={{ color: '#808080', fontStyle: 'italic', margin: 0 }}>No historical records found.</p>
                ) : (
                  <table className="classic-table" style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Resolved/Ignored At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTickets.map(t => (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td style={{ color: t.status === 'IGNORED' ? 'red' : 'green', fontWeight: 'bold' }}>{t.status}</td>
                          <td>{t.title}</td>
                          <td>{t.category}</td>
                          <td>{new Date(t.updatedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View/Action Details Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <Rnd default={{ x: window.innerWidth / 2 - 275, y: Math.max(50, window.innerHeight / 2 - 250), width: 550 }} dragHandleClassName="title-bar" enableResizing={false} bounds="window">
          <div className="window" style={{ width: '100%', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
            <div className="title-bar" style={{ background: selectedTicket.status === 'IN_PROGRESS' ? '#008000' : '#000080' }}>
              <span>Action Center - Ticket #{selectedTicket.id}</span>
              <button className="btn" onClick={() => setSelectedTicket(null)} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
            </div>
            
            <div style={{ padding: '15px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <fieldset style={{ height: '100%' }}>
                    <legend>Metadata</legend>
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong>Title:</strong> {selectedTicket.title}<br/>
                      <strong>Created By:</strong> {selectedTicket.creatorName}<br/>
                      <strong>Status:</strong> {selectedTicket.status}<br/>
                      <strong>Priority:</strong> {selectedTicket.priority}<br/>
                      <strong>Category:</strong> {selectedTicket.category}
                      <div style={{ marginTop: '10px' }}>
                        <button className="btn" onClick={() => handleViewHistory(selectedTicket.id)}>
                          [ View Audit Trail ]
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </div>
                <div style={{ flex: 1 }}>
                  <fieldset style={{ height: '100%' }}>
                    <legend>Description</legend>
                    <div style={{ whiteSpace: 'pre-wrap', height: '80px', overflowY: 'auto', padding: '5px', background: '#fff', border: '1px inset var(--border-dark)', fontSize: '12px' }}>
                      {selectedTicket.description}
                    </div>
                  </fieldset>
                </div>
              </div>

              {/* AI Smart Draft Section */}
              <div style={{ borderTop: '2px groove #dfdfdf', paddingTop: '10px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <strong>Resolution Note / Draft:</strong>
                  <button 
                    className="btn" 
                    onClick={async () => {
                      const { getDraftReply } = await import('../api');
                      try {
                        const draft = await getDraftReply({
                          ticketTitle: selectedTicket.title,
                          ticketDescription: selectedTicket.description,
                          pastComments: ""
                        });
                        document.getElementById('resolutionNote').value = draft;
                      } catch (e) {
                        alert("AI Error: " + e.message);
                      }
                    }}
                  >
                    <span style={{ color: '#000080', fontWeight: 'bold' }}>✨ Smart Draft</span>
                  </button>
                </div>
                <textarea 
                  id="resolutionNote"
                  className="input-field" 
                  rows="3" 
                  style={{ width: '100%', fontSize: '12px' }}
                  placeholder="Enter your resolution or let AI draft it for you..."
                ></textarea>
              </div>

              <div style={{ borderTop: '2px groove #dfdfdf', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedTicket.status === 'OPEN' && (
                    <button className="btn" onClick={() => handlePickup(selectedTicket.id)} style={{ fontWeight: 'bold' }}>
                      [ Pick Up Ticket ]
                    </button>
                  )}
                  {selectedTicket.status === 'IN_PROGRESS' && (
                    <>
                      <button className="btn" onClick={() => handleComplete(selectedTicket.id)} style={{ fontWeight: 'bold', color: 'green' }}>
                        [ Mark Complete ]
                      </button>
                      <button className="btn" onClick={() => setIgnoreModalOpen(true)} style={{ fontWeight: 'bold', color: 'red' }}>
                        [ Ignore ]
                      </button>
                    </>
                  )}
                </div>
                <button className="btn" onClick={() => setSelectedTicket(null)}>Close Window</button>
              </div>
            </div>
          </div>
          </Rnd>
        </div>
      )}

      {/* Ignore Reason Modal */}
      {ignoreModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <Rnd default={{ x: window.innerWidth / 2 - 200, y: Math.max(50, window.innerHeight / 2 - 150), width: 400 }} dragHandleClassName="title-bar" enableResizing={false} bounds="window">
          <div className="window" style={{ width: '100%', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
            <div className="title-bar" style={{ background: '#800000' }}>
              <span>Warning: Ignore Ticket</span>
              <button className="btn" onClick={() => setIgnoreModalOpen(false)} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
            </div>
            <div style={{ padding: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
                <div style={{ fontSize: '32px', color: 'red', fontWeight: 'bold' }}>!</div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px' }}>You are about to Ignore this ticket. Please provide a mandatory reason for the system logs.</p>
                </div>
              </div>
              <form onSubmit={handleIgnore}>
                <textarea 
                  className="input-field" 
                  rows="4" 
                  style={{ width: '100%', marginBottom: '15px' }}
                  value={ignoreReason}
                  onChange={(e) => setIgnoreReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="submit" className="btn" style={{ fontWeight: 'bold' }}>Confirm Ignore</button>
                  <button type="button" className="btn" onClick={() => setIgnoreModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
          </Rnd>
        </div>
      )}

      {/* Processing / Loading Modal */}
      {processingModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }}>
          <Rnd default={{ x: window.innerWidth / 2 - 175, y: Math.max(50, window.innerHeight / 2 - 100), width: 350 }} dragHandleClassName="title-bar" enableResizing={false} bounds="window">
          <div className="window" style={{ width: '100%', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
            <div className="title-bar">
              <span>System Processing</span>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px' }}>Saving state to mainframe... please wait.</p>
              
              <div style={{ width: '100%', height: '20px', border: '2px inset #dfdfdf', background: '#fff', position: 'relative' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: '#000080', 
                  transition: 'width 0.2s' 
                }}></div>
              </div>
              
              <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                {progress}% Complete
              </div>
            </div>
          </div>
          </Rnd>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1300 }}>
          <Rnd default={{ x: window.innerWidth / 2 - 300, y: Math.max(50, window.innerHeight / 2 - 200), width: 600 }} dragHandleClassName="title-bar" enableResizing={false} bounds="window">
          <div className="window" style={{ width: '100%', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
            <div className="title-bar" style={{ background: '#808080' }}>
              <span>Audit Trail - Ticket #{selectedTicket?.id}</span>
              <button className="btn" onClick={() => setHistoryModalOpen(false)} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
            </div>
            <div style={{ padding: '15px', flex: 1, overflowY: 'auto' }}>
              {ticketHistory.length === 0 ? (
                <p>No history recorded for this ticket.</p>
              ) : (
                <table className="classic-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.timestamp).toLocaleString()}</td>
                        <td>{h.actorEmail}</td>
                        <td style={{ fontWeight: 'bold' }}>{h.action}</td>
                        <td>{h.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '10px', borderTop: '2px groove #dfdfdf', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
          </Rnd>
        </div>
      )}

      <ClippyCopilot contextData={
        (selectedTicket 
          ? `CURRENTLY VIEWING TICKET:\nTicket #${selectedTicket.id}: ${selectedTicket.title}\nDescription: ${selectedTicket.description}\nStatus: ${selectedTicket.status}\n\n`
          : "No ticket is currently selected.\n\n") +
        `OVERALL QUEUE:\nTotal pending tickets: ${tickets.length}\n` +
        tickets.map(t => `- #${t.id}: ${t.title} [${t.status}]`).join("\n")
      } />

      {/* Toasts Container */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 2000 }}>
        {toasts.map(toast => (
          <div key={toast.id} className="window" style={{ width: '300px', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)', background: '#dfdfdf' }}>
            <div className="title-bar" style={{ background: '#000080' }}>
              <span>System Notification</span>
            </div>
            <div style={{ padding: '10px', fontSize: '12px' }}>
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      <Taskbar 
        onLogout={handleLogout} 
        workspaceName={`Agent Workspace - ${displayUser}`}
        isMinimized={isMinimized} 
        setIsMinimized={setIsMinimized} 
      />

    </div>
  );
}
