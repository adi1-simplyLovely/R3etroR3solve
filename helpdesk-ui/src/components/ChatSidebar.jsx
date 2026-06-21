import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getAuthToken, getChatHistory, clearChatHistory, getUserFromToken, getOnlineUsersApi } from '../api';

export default function ChatSidebar() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'online'
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojis = ['😀', '😂', '😎', '😍', '🤔', '😭', '😡', '👍', '👎', '🎉', '💻', '🔥', '👀', '💡', '✅', '❌'];
  const currentUser = getUserFromToken();

  const handleTyping = () => {
    if (stompClient.current && stompClient.current.connected) {
      if (!typingTimeoutRef.current) {
        stompClient.current.publish({ destination: '/app/chat.typing' });
      } else {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Fetch initial chat history
    getChatHistory().then(history => {
      setMessages(history || []);
    }).catch(err => console.error("Failed to load chat history", err));

    const fetchOnlineUsers = () => {
      getOnlineUsersApi().then(users => {
        if (users && Array.isArray(users)) {
            const uniqueUsers = [];
            const seen = new Set();
            for (let u of users) {
               if (!seen.has(u.name)) {
                   seen.add(u.name);
                   uniqueUsers.push(u);
               }
            }
            setOnlineUsers(uniqueUsers);
        }
      }).catch(err => console.error("Failed to fetch initial online users", err));
    };

    fetchOnlineUsers();
    
    // Periodically sync online users every 5 seconds to prevent them from showing 0 when a tab misses the broadcast
    const syncInterval = setInterval(fetchOnlineUsers, 5000);

    stompClient.current = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.current.onConnect = (frame) => {
      console.log('Connected to STOMP');
      setIsConnected(true);
      
      // Subscribe to public chat
      stompClient.current.subscribe('/topic/public', (msg) => {
        if (msg.body) {
          const chatMsg = JSON.parse(msg.body);
          setMessages(prev => [...prev, chatMsg]);
        }
      });

      // Subscribe to online users
      stompClient.current.subscribe('/topic/online-users', (msg) => {
        if (msg.body) {
          const users = JSON.parse(msg.body);
          
          // Deduplicate users by name for display purposes
          const uniqueUsers = [];
          const seen = new Set();
          for (let u of users) {
             if (!seen.has(u.name)) {
                 seen.add(u.name);
                 uniqueUsers.push(u);
             }
          }
          setOnlineUsers(uniqueUsers);
        }
      });
      
      // Subscribe to typing indicator
      stompClient.current.subscribe('/topic/typing', (msg) => {
        if (msg.body) {
          const { username } = JSON.parse(msg.body);
          if (username !== currentUser?.firstName + ' ' + currentUser?.lastName && username !== currentUser?.sub) {
            setTypingUsers(prev => {
              if (!prev.includes(username)) return [...prev, username];
              return prev;
            });
            
            // Auto remove typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u !== username));
            }, 3000);
          }
        }
      });
      
      // Subscribe to tickets for AgentDashboard
      stompClient.current.subscribe('/topic/tickets', (msg) => {
        if (msg.body) {
          const newTicket = JSON.parse(msg.body);
          window.dispatchEvent(new CustomEvent('new-ticket', { detail: newTicket }));
        }
      });
      
      // Send a fake join message if needed, or backend handles presence.
    };

    stompClient.current.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.current.activate();

    return () => {
      clearInterval(syncInterval);
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  const handleClearLog = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify({ content: "MAINFRAME PURGED BY ADMINISTRATOR" }),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to clear log");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && stompClient.current && stompClient.current.connected) {
      const msg = {
        content: inputMessage.trim()
      };
      stompClient.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(msg),
      });
      setInputMessage('');
      setEmojiPickerOpen(false);
    }
  };

  const insertEmoji = (emoji) => {
    setInputMessage(prev => prev + emoji);
  };

  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  return (
    <div className="window" style={{ width: '250px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="title-bar" style={{ background: '#000080' }}>
        <span style={{ flex: 1 }}>Global Network</span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
           <span style={{ fontSize: '10px', color: isConnected ? '#0f0' : '#f00' }}>●</span>
           {isAdmin && activeTab === 'chat' && (
             <button onClick={handleClearLog} className="btn" style={{ fontSize: '10px', padding: '1px 3px', color: 'red', fontWeight: 'bold' }}>CLEAR</button>
           )}
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-dark)', background: '#c0c0c0' }}>
        <button 
          className="btn" 
          style={{ flex: 1, borderBottom: activeTab === 'chat' ? 'none' : '2px solid var(--border-dark)', background: activeTab === 'chat' ? '#dfdfdf' : '#c0c0c0', fontWeight: activeTab === 'chat' ? 'bold' : 'normal' }}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button 
          className="btn" 
          style={{ flex: 1, borderBottom: activeTab === 'online' ? 'none' : '2px solid var(--border-dark)', background: activeTab === 'online' ? '#dfdfdf' : '#c0c0c0', fontWeight: activeTab === 'online' ? 'bold' : 'normal' }}
          onClick={() => setActiveTab('online')}
        >
          Online ({onlineUsers.length})
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', border: '2px inset #dfdfdf', margin: '5px', position: 'relative' }}>
        
        {activeTab === 'chat' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '5px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#000', color: '#0f0', fontFamily: 'monospace' }}>
              {messages.length === 0 ? (
                <div style={{ color: '#0f0', fontStyle: 'italic', marginTop: '10px' }}>
                  {isConnected ? "C:\\> Mainframe connected. No messages." : "C:\\> Connecting to mainframe..."}
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} style={{ wordBreak: 'break-word' }}>
                    <span style={{ color: msg.senderRole === 'ADMIN' ? '#ff5555' : msg.senderRole === 'AGENT' ? '#5555ff' : '#0f0', fontWeight: 'bold' }}>
                      {msg.senderName}&gt;
                    </span>
                    <span style={{ color: '#fff' }}> {msg.content}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker Popup */}
            {emojiPickerOpen && (
              <div className="window" style={{ position: 'absolute', bottom: '35px', left: '5px', width: '225px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', padding: '5px', background: '#c0c0c0', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', zIndex: 100 }}>
                {emojis.map(emoji => (
                  <button key={emoji} type="button" className="btn" style={{ padding: '2px', fontSize: '14px', textAlign: 'center' }} onClick={() => insertEmoji(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div style={{ padding: '2px 5px', fontSize: '10px', color: '#000080', background: '#dfdfdf', fontStyle: 'italic', borderTop: '1px solid #808080' }}>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <form onSubmit={sendMessage} style={{ display: 'flex', padding: '2px', background: '#000', borderTop: '2px solid #dfdfdf', alignItems: 'center', fontFamily: 'monospace' }}>
              <button type="button" className="btn" style={{ padding: '0px 4px', fontSize: '16px', marginRight: '4px', flexShrink: 0 }} onClick={() => setEmojiPickerOpen(!emojiPickerOpen)} title="Insert Emoji">
                ☺
              </button>
              <span style={{ color: '#0f0', fontWeight: 'bold', marginRight: '4px', flexShrink: 0 }}>C:\&gt;</span>
              <input 
                type="text" 
                style={{ flex: 1, minWidth: 0, background: '#000', color: '#fff', border: 'none', outline: 'none', fontFamily: 'monospace' }}
                placeholder="Type message_" 
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping();
                }}
              />
              <button type="submit" className="btn" style={{ padding: '2px 8px', marginLeft: '4px', fontWeight: 'bold', flexShrink: 0 }}>&gt;</button>
            </form>
          </>
        )}

        {activeTab === 'online' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '5px', fontSize: '12px', background: '#000080', color: 'white' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid white', paddingBottom: '5px' }}>Active Connections</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {onlineUsers.length === 0 ? (
                <li style={{ fontStyle: 'italic', color: '#c0c0c0' }}>Scanning network...</li>
              ) : (
                onlineUsers.map((user, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff00', boxShadow: '0 0 5px #00ff00' }}></div>
                    <span>
                      <strong>{user.name}</strong> 
                      <span style={{ color: '#c0c0c0', marginLeft: '5px' }}>({user.role})</span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
