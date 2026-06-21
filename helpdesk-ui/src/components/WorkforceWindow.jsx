import React, { useEffect, useState } from 'react';
import { getWorkforce } from '../api';
import { Rnd } from 'react-rnd';

export default function WorkforceWindow({ onClose }) {
  const [workforce, setWorkforce] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      getWorkforce()
        .then(res => {
          setWorkforce(res || []);
        })
        .catch(err => {
          console.error("Failed to load workforce data", err);
        })
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    return new Date(timeStr).toLocaleString();
  };

  const activeCount = workforce.filter(u => u.isActive).length;
  const deletedCount = workforce.filter(u => !u.isActive).length;

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 300,
        y: window.innerHeight / 2 - 200,
        width: 600,
        height: 400
      }}
      minWidth={400}
      minHeight={300}
      bounds="window"
      dragHandleClassName="title-bar"
      style={{ zIndex: 1500 }}
    >
      <div className="window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
        <div className="title-bar" style={{ background: '#000080', cursor: 'move' }}>
          <span style={{ fontWeight: 'bold' }}>Company Workforce & Colleague Tracker</span>
          <button className="btn" style={{ padding: '0 4px', fontWeight: 'bold' }} onClick={onClose}>X</button>
        </div>

        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Stats Header */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', background: '#fff', padding: '10px', border: '2px inset #dfdfdf' }}>
             <div><strong>Total Registered:</strong> {workforce.length}</div>
             <div style={{ color: '#008000' }}><strong>Active:</strong> {activeCount}</div>
             <div style={{ color: '#ff0000' }}><strong>Left Workforce:</strong> {deletedCount}</div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff', border: '2px inset #dfdfdf' }}>
            {loading ? (
              <div style={{ padding: '10px' }}>Loading network data...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ background: '#dfdfdf', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Status</th>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Name</th>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Role</th>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Department</th>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Last Login</th>
                    <th style={{ border: '1px solid #808080', padding: '4px', textAlign: 'left' }}>Last Logout</th>
                  </tr>
                </thead>
                <tbody>
                  {workforce.map(user => (
                    <tr key={user.id} style={{ background: user.isActive ? '#fff' : '#ffe0e0' }}>
                      <td style={{ border: '1px solid #808080', padding: '4px', color: user.isActive ? '#008000' : '#ff0000', fontWeight: 'bold' }}>
                        {user.isActive ? 'Active' : 'Left'}
                      </td>
                      <td style={{ border: '1px solid #808080', padding: '4px', textDecoration: user.isActive ? 'none' : 'line-through' }}>{user.name}</td>
                      <td style={{ border: '1px solid #808080', padding: '4px' }}>{user.role}</td>
                      <td style={{ border: '1px solid #808080', padding: '4px' }}>{user.department}</td>
                      <td style={{ border: '1px solid #808080', padding: '4px' }}>{formatTime(user.lastLoginTime)}</td>
                      <td style={{ border: '1px solid #808080', padding: '4px' }}>{formatTime(user.lastLogoutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
