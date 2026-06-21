import React from 'react';

export default function TicketCard({ ticket }) {
  return (
    <div className="window" style={{ marginBottom: '15px' }}>
      <div className="title-bar">
        <span>Ticket #{ticket.id} - {ticket.title}</span>
        <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }}>_</button>
      </div>
      <div style={{ padding: '10px' }}>
        <table className="classic-table" style={{ marginBottom: '10px' }}>
          <tbody>
            <tr>
              <th style={{ width: '100px' }}>Status</th>
              <td><span className="status-badge">{ticket.status}</span></td>
            </tr>
            <tr>
              <th>Priority</th>
              <td>{ticket.priority}</td>
            </tr>
            <tr>
              <th>Category</th>
              <td>{ticket.category}</td>
            </tr>
            <tr>
              <th>Created By</th>
              <td>{ticket.creatorName}</td>
            </tr>
          </tbody>
        </table>
        
        <fieldset>
          <legend>Description</legend>
          <div style={{ whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', padding: '5px', border: '1px inset var(--border-dark)', background: '#fff' }}>
            {ticket.description}
          </div>
        </fieldset>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
          <button className="btn">View Details</button>
        </div>
      </div>
    </div>
  );
}
