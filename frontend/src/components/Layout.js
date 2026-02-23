import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = {
  student: [
    { to: '/student', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/student/courses', label: 'My Courses', icon: '📚' },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/teacher/courses', label: 'My Courses', icon: '📋' },
    { to: '/teacher/analytics', label: 'Analytics', icon: '📊' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/courses', label: 'Courses', icon: '🎓' },
  ],
};

const roleMeta = {
  student: { label: 'Student', color: 'cyan', gradient: 'var(--gradient-cyan)' },
  teacher: { label: 'Teacher', color: 'purple', gradient: 'var(--gradient-primary)' },
  admin: { label: 'Admin', color: 'amber', gradient: 'var(--gradient-amber)' },
};

export default function Layout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = roleMeta[role];
  const items = navItems[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon" style={{ background: meta.gradient }}>EP</div>
            <div>
              <div className="logo-name">EduPulse</div>
              <div className="logo-sub">AI Feedback</div>
            </div>
          </div>
        </div>

        <div className="sidebar-role">
          <span className={`badge badge-${meta.color}`}>{meta.label}</span>
          <span className="sidebar-username">{user?.full_name || user?.username}</span>
        </div>

        <nav className="sidebar-nav">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: meta.gradient }}>
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.full_name || user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ↪
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="main-content">
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="logo-name">EduPulse</div>
        </div>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}