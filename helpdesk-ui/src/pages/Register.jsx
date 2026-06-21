import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'IT'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Direct API call since we don't have a register method in api.js yet
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="window" style={{ width: '100%', maxWidth: '400px' }}>
        
        <div className="title-bar">
          <span>System Registration</span>
          <button className="btn" style={{ padding: '0px 4px', fontWeight: 'bold' }} onClick={() => navigate('/')}>X</button>
        </div>

        <div style={{ padding: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
            <div style={{ fontSize: '32px', padding: '5px' }}>
              [ + ]
            </div>
            <div>
              <h2 style={{ fontSize: '16px', margin: 0 }}>New Account Setup</h2>
              <p style={{ margin: 0, fontSize: '12px' }}>Please provide your details.</p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#ff0000', color: '#fff', padding: '5px', marginBottom: '15px', fontWeight: 'bold', wordBreak: 'break-word' }}>
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset>
              <legend>Personal Info</legend>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '3px' }}>First Name:</label>
                  <input type="text" className="input-field" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '3px' }}>Last Name:</label>
                  <input type="text" className="input-field" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '3px' }}>Email:</label>
                <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '3px' }}>Password:</label>
                <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <small style={{ color: 'var(--border-dark)' }}>Requires 8 chars, 1 uppercase, 1 number.</small>
              </div>
            </fieldset>

            <fieldset>
              <legend>Access Configuration</legend>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '3px' }}>System Role:</label>
                <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="EMPLOYEE">Standard Employee</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {formData.role === 'SUPPORT_AGENT' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '3px' }}>Department (Agent Specialization):</label>
                  <select className="input-field" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                    <option value="IT">IT (Hardware, Software, Network)</option>
                    <option value="HR">HR (Payroll, Benefits)</option>
                    <option value="FINANCE">Finance</option>
                    <option value="FACILITIES">Facilities</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <Link to="/" style={{ fontSize: '12px', color: '#000' }}>&lt;&lt; Back to Login</Link>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Wait...' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
