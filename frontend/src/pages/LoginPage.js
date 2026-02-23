import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = { admin: ['admin','admin123'], teacher: ['prof_smith','teacher123'], student: ['student1','student123'] };
    const [u, p] = creds[role];
    setForm({ username: u, password: p });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">EP</div>
            <div>
              <h1 className="auth-logo-title">EduPulse</h1>
              <p className="auth-logo-sub">AI-Powered Feedback System</p>
            </div>
          </div>

          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div className="demo-section">
            <div className="demo-label">Quick Demo Access</div>
            <div className="demo-buttons">
              <button onClick={() => fillDemo('student')} className="demo-btn">
                <span>🎓</span> Student
              </button>
              <button onClick={() => fillDemo('teacher')} className="demo-btn">
                <span>👨‍🏫</span> Teacher
              </button>
              <button onClick={() => fillDemo('admin')} className="demo-btn">
                <span>⚙️</span> Admin
              </button>
            </div>
          </div>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register here</Link>
          </p>
        </div>

        <div className="auth-info">
          <div className="info-title">AI-Powered Insights</div>
          <div className="info-features">
            {['Sentiment Analysis', 'Auto Summaries', 'Keyword Extraction', 'Performance Scores', 'Trend Analysis'].map(f => (
              <div key={f} className="info-feature">
                <span className="info-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}