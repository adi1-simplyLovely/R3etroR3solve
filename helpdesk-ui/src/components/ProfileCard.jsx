import React, { useState, useEffect } from 'react';
import { getMe } from '../api';
import { Rnd } from 'react-rnd';

export default function ProfileCard({ onClose }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then(data => setUser(data)).catch(console.error);
  }, []);

  if (!user) return null;

  return (
    <Rnd
      default={{
        x: window.innerWidth - 240,
        y: window.innerHeight - 200,
        width: 220,
        height: 'auto'
      }}
      bounds="window"
      dragHandleClassName="title-bar"
      style={{ zIndex: 2500 }}
    >
      <div className="window" style={{ width: '100%', height: '100%', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
        <div className="title-bar" style={{ background: '#000080', cursor: 'move' }}>
          <span>Current Identification</span>
          <button className="btn" onClick={onClose} style={{ padding: '0px 4px', fontWeight: 'bold', color: 'black' }}>X</button>
        </div>
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', background: '#c0c0c0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <div style={{ width: '40px', height: '40px', background: '#dfdfdf', border: '2px inset #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{user.firstName} {user.lastName}</div>
              <div style={{ color: '#000080', fontWeight: 'bold' }}>{user.role}</div>
            </div>
          </div>
          <div style={{ borderTop: '2px groove #dfdfdf', margin: '5px 0' }}></div>
          <div><strong>Email:</strong><br/><span style={{ fontSize: '10px' }}>{user.email}</span></div>
          <div><strong>Dept:</strong> {user.department || 'N/A'}</div>
          <div><strong>Status:</strong> <span style={{ color: '#008000', fontWeight: 'bold' }}>Active</span></div>
        </div>
      </div>
    </Rnd>
  );
}
