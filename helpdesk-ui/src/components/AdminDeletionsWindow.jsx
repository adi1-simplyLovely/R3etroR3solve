import React, { useEffect, useState } from 'react';
import { getDeletionRequests, approveDeletion, rejectDeletion } from '../api';
import { Rnd } from 'react-rnd';

export default function AdminDeletionsWindow({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    getDeletionRequests().then(res => {
      setRequests(res.data);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    await approveDeletion(id);
    fetchRequests();
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (reason) {
      await rejectDeletion(id, reason);
      fetchRequests();
    }
  };

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 250,
        y: window.innerHeight / 2 - 200,
        width: 500,
        height: 400
      }}
      bounds="window"
      dragHandleClassName="title-bar"
      style={{ zIndex: 1600 }}
    >
      <div className="window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
        <div className="title-bar" style={{ cursor: 'move' }}>
          <span>Administrator Deletion Requests</span>
          <button className="btn" onClick={onClose} style={{ padding: '0px 4px', fontWeight: 'bold' }}>X</button>
        </div>
        <div style={{ padding: '10px', flex: 1, overflowY: 'auto', background: '#fff', border: '2px inset #dfdfdf' }}>
          {loading ? <p>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#c0c0c0', textAlign: 'left' }}>
                  <th style={{ border: '1px solid #808080', padding: '4px' }}>User</th>
                  <th style={{ border: '1px solid #808080', padding: '4px' }}>Date</th>
                  <th style={{ border: '1px solid #808080', padding: '4px' }}>Status</th>
                  <th style={{ border: '1px solid #808080', padding: '4px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td style={{ border: '1px solid #dfdfdf', padding: '4px' }}>{r.user.firstName} {r.user.lastName}</td>
                    <td style={{ border: '1px solid #dfdfdf', padding: '4px' }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                    <td style={{ border: '1px solid #dfdfdf', padding: '4px' }}>{r.status}</td>
                    <td style={{ border: '1px solid #dfdfdf', padding: '4px' }}>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn" onClick={() => handleApprove(r.id)}>Approve</button>
                          <button className="btn" onClick={() => handleReject(r.id)}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Rnd>
  );
}
