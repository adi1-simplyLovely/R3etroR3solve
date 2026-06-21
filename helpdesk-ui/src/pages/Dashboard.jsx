import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthToken, createTicket, getMyTickets, getUserFromToken, getRouteSuggestion, getDeflectionSuggestion, getCurrentUserApi } from '../api';
import { Rnd } from 'react-rnd';
import Taskbar from '../components/Taskbar';
import ChatSidebar from '../components/ChatSidebar';
import ProfileCard from '../components/ProfileCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Ticket Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT_HARDWARE');
  const [priority, setPriority] = useState('LOW');
  const [submitError, setSubmitError] = useState('');
  
  const [isMinimized, setIsMinimized] = useState(false);

  const currentUser = getUserFromToken();
  const [displayUser, setDisplayUser] = useState(currentUser ? (currentUser.name || currentUser.sub) : 'Unknown User');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [deflection, setDeflection] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  
  const titleInputRef = React.useRef(null);

  useEffect(() => {
    fetchTickets();
    getCurrentUserApi().then(user => {
      if (user && user.firstName) {
        setDisplayUser(`${user.firstName} ${user.lastName}`);
      }
    }).catch(console.error);
    
    const handleFocusNewTicket = () => {
      titleInputRef.current?.focus();
    };
    window.addEventListener('focus-new-ticket', handleFocusNewTicket);
    return () => window.removeEventListener('focus-new-ticket', handleFocusNewTicket);
  }, [navigate]);

  useEffect(() => {
    document.title = `🎫 ${displayUser} - Employee Workspace`;
  }, [displayUser]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (title.length > 5 || description.length > 10) {
        setIsRouting(true);
        try {
          // 1. Deflection
          const deflect = await getDeflectionSuggestion(title, description);
          setDeflection(deflect || '');
          
          // 2. Routing
          const routeStr = await getRouteSuggestion(title, description);
          if (routeStr) {
            try {
              const routeJson = JSON.parse(routeStr);
              if (routeJson.category) setCategory(routeJson.category);
              if (routeJson.priority) setPriority(routeJson.priority);
            } catch (e) {
              console.warn("AI Routing JSON parse failed", e);
            }
          }
        } catch (e) {
          console.error("AI Assistant Error:", e);
        } finally {
          setIsRouting(false);
        }
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(handler);
  }, [title, description]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getMyTickets();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await createTicket({ title, description, category, priority });
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/');
  };

  const activeTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_USER');
  const historyTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'IGNORED' || t.status === 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-desktop)' }}>

      {!isMinimized && (
        <div style={{ display: 'flex', flex: 1, padding: '20px', paddingBottom: '60px', gap: '20px' }}>
          
          <ChatSidebar />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '20px', height: '350px' }}>
              
              {/* Active Tickets List Window */}
              <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="title-bar" style={{ background: 'var(--bg-title)' }}>
                  <span>My Active Requests</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }} onClick={() => setIsMinimized(true)}>_</button>
                    <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
                  </div>
                </div>
                
                <div style={{ padding: '4px', background: '#dfdfdf', borderBottom: '2px solid var(--border-dark)', display: 'flex', gap: '5px' }}>
                  <button className="btn" onClick={fetchTickets}>View &gt; Refresh</button>
                  <button className="btn" onClick={handleLogout}>System &gt; Logout</button>
                </div>

                <div style={{ padding: '15px', flex: 1, overflowY: 'auto', background: '#c0c0c0' }}>
                  {loading ? (
                    <p>Loading records...</p>
                  ) : activeTickets.length === 0 ? (
                    <div style={{ padding: '10px', background: '#fff', border: '2px inset #dfdfdf' }}>
                      <p style={{ margin: 0 }}>You have no active support requests.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                      {activeTickets.map(ticket => (
                        <div key={ticket.id} className="window" style={{ background: 'var(--bg-window)' }}>
                          <div className="title-bar" style={{ background: 'var(--bg-title)' }}>
                            <span>#{ticket.id} - {ticket.title}</span>
                          </div>
                          <div style={{ padding: '10px' }}>
                            <div style={{ marginBottom: '5px', fontSize: '12px' }}>
                              <strong>Status:</strong> {ticket.status}<br/>
                              <strong>Category:</strong> {ticket.category}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button className="btn" onClick={() => setSelectedTicket(ticket)}>View Details</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Create New Ticket Form Window */}
              <div className="window" style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
                <div className="title-bar">
                  <span>Create New Request</span>
                </div>
                
                <div style={{ padding: '15px', flex: 1, overflowY: 'auto' }}>
                  {submitError && (
                    <div style={{ background: '#ff0000', color: '#fff', padding: '5px', marginBottom: '15px', fontWeight: 'bold', wordBreak: 'break-word' }}>
                      ERROR: {submitError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>Title:</label>
                      <input 
                        ref={titleInputRef}
                        type="text" 
                        className="input-field" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>Description:</label>
                      <textarea 
                        className="input-field" 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        rows="4"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>
                          Category:
                          {isRouting && <span style={{ color: 'green', marginLeft: '5px', fontSize: '10px' }}>(AI Routing...)</span>}
                        </label>
                        <select className="input-field" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: isRouting ? '#e0ffe0' : '#ffffff' }}>
                          <option value="IT_HARDWARE">IT Hardware</option>
                          <option value="IT_SOFTWARE">IT Software</option>
                          <option value="IT_NETWORK">IT Network</option>
                          <option value="IT_ACCESS">IT Access / Passwords</option>
                          <option value="HR_PAYROLL">HR Payroll</option>
                          <option value="HR_BENEFITS">HR Benefits</option>
                          <option value="FINANCE_EXPENSES">Finance Expenses</option>
                          <option value="FACILITIES_MAINTENANCE">Facilities</option>
                          <option value="OTHER_GENERAL">Other</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>
                          Priority:
                        </label>
                        <select className="input-field" value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', background: isRouting ? '#e0ffe0' : '#ffffff' }}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {deflection && (
                      <div style={{ border: '2px outset #dfdfdf', background: '#ffffe0', padding: '10px', marginTop: '5px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>💡 AI Quick Fix Suggestion:</div>
                        <div>{deflection}</div>
                        <div style={{ marginTop: '5px', textAlign: 'right', fontSize: '10px', color: '#808080' }}>If this solves your issue, you don't need to submit!</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="submit" className="btn" style={{ fontWeight: 'bold' }}>Submit Request</button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

            {/* History Window */}
            <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="title-bar" style={{ background: '#808080' }}>
                <span>My Request History</span>
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
                        <th>Resolution Date</th>
                        <th>Actions</th>
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
                          <td>
                            <button className="btn" style={{ padding: '2px 5px' }} onClick={() => setSelectedTicket(t)}>View</button>
                          </td>
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

      {/* View Details Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <Rnd default={{ x: window.innerWidth / 2 - 250, y: Math.max(50, window.innerHeight / 2 - 200), width: 500 }} dragHandleClassName="title-bar" enableResizing={false} bounds="window">
          <div className="window" style={{ width: '100%', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
            <div className="title-bar" style={{ background: selectedTicket.status === 'IGNORED' ? '#800000' : '#000080' }}>
              <span>Ticket Details - #{selectedTicket.id}</span>
              <button className="btn" onClick={() => setSelectedTicket(null)} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
            </div>
            
            <div style={{ padding: '15px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <fieldset style={{ height: '100%' }}>
                    <legend>Metadata</legend>
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong>Title:</strong> {selectedTicket.title}<br/>
                      <strong>Status:</strong> <span style={{ color: selectedTicket.status === 'IGNORED' ? 'red' : (selectedTicket.status === 'RESOLVED' ? 'green' : 'black'), fontWeight: 'bold' }}>{selectedTicket.status}</span><br/>
                      <strong>Priority:</strong> {selectedTicket.priority}<br/>
                      <strong>Category:</strong> {selectedTicket.category}<br/>
                      <strong>Assigned To:</strong> {selectedTicket.assigneeName || 'Unassigned'}
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

              {selectedTicket.status === 'IGNORED' && (
                <div style={{ marginBottom: '15px' }}>
                  <fieldset style={{ borderColor: 'red' }}>
                    <legend style={{ color: 'red', fontWeight: 'bold' }}>Rejection Reason</legend>
                    <div style={{ whiteSpace: 'pre-wrap', padding: '5px', background: '#fff', border: '1px inset var(--border-dark)', fontSize: '12px', color: 'red' }}>
                      {selectedTicket.rejectionReason || "No reason provided."}
                    </div>
                  </fieldset>
                </div>
              )}

              {selectedTicket.status === 'RESOLVED' && selectedTicket.comments && selectedTicket.comments.some(c => c.content.startsWith("Resolution Note:")) && (
                <div style={{ marginBottom: '15px', marginTop: '15px' }}>
                  <fieldset style={{ borderColor: 'green' }}>
                    <legend style={{ color: 'green', fontWeight: 'bold' }}>Resolution Note</legend>
                    <div style={{ whiteSpace: 'pre-wrap', padding: '5px', background: '#fff', border: '1px inset var(--border-dark)', fontSize: '12px', color: 'green' }}>
                      {selectedTicket.comments.find(c => c.content.startsWith("Resolution Note:")).content.replace("Resolution Note: ", "")}
                    </div>
                  </fieldset>
                </div>
              )}

              <div style={{ borderTop: '2px groove #dfdfdf', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setSelectedTicket(null)}>Close</button>
              </div>
            </div>
          </div>
          </Rnd>
        </div>
      )}

      <Taskbar 
        onLogout={handleLogout} 
        workspaceName={`Employee Workspace - ${displayUser}`} 
        isMinimized={isMinimized} 
        setIsMinimized={setIsMinimized} 
      />

    </div>
  );
}
