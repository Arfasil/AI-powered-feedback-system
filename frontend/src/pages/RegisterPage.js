import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', department: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      await register({ username: form.username, email: form.email, full_name: form.full_name, department: form.department, password: form.password });
      navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const upd = (k) => (e) => setForm({...form, [k]: e.target.value});

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container" style={{justifyContent:'center'}}>
        <div className="auth-card" style={{maxWidth: 480}}>
          <div className="auth-logo">
            <div className="auth-logo-icon">EP</div>
            <div>
              <h1 className="auth-logo-title">EduPulse</h1>
              <p className="auth-logo-sub">Create Student Account</p>
            </div>
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join EduPulse as a student</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={upd('full_name')} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" value={form.username} onChange={upd('username')} placeholder="username" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={upd('email')} placeholder="email@university.edu" required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={upd('department')} placeholder="e.g. Computer Science" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={form.password} onChange={upd('password')} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm</label>
                <input type="password" className="form-input" value={form.confirm} onChange={upd('confirm')} placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating...</> : 'Create Account →'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}