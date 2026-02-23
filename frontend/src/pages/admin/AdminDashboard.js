import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const s = stats || {};
  const sentimentTotal = (s.sentiment_overview?.positive || 0) + (s.sentiment_overview?.neutral || 0) + (s.sentiment_overview?.negative || 0) || 1;
  const posPct = Math.round((s.sentiment_overview?.positive || 0) / sentimentTotal * 100);
  const negPct = Math.round((s.sentiment_overview?.negative || 0) / sentimentTotal * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800}}>Admin Dashboard</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>System-wide overview and management</p>
        </div>
      </div>

      <div className="grid-4 mb-6">
        {[
          {label:'Total Users', value: s.total_users, icon:'👥', color:'blue'},
          {label:'Students', value: s.total_students, icon:'🎓', color:'cyan'},
          {label:'Teachers', value: s.total_teachers, icon:'👨‍🏫', color:'purple'},
          {label:'Active Courses', value: s.total_courses, icon:'📚', color:'green'},
        ].map(stat => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-icon" style={{background:`rgba(59,130,246,0.12)`,fontSize:22}}>{stat.icon}</div>
            <div className="stat-value">{stat.value || 0}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-6">
        {/* System Health */}
        <div className="card">
          <h3 className="font-semibold mb-4">📊 System Metrics</h3>
          {[
            {label:'Total Enrollments', value: s.total_enrollments, max: s.total_students * (s.total_courses || 1), color:'var(--accent-blue)'},
            {label:'Feedback Submissions', value: s.total_feedback, max: s.total_enrollments || 1, color:'var(--accent-green)'},
            {label:'Feedback Rate', value: `${Math.round((s.total_feedback || 0)/(s.total_enrollments || 1)*100)}%`, progress: (s.total_feedback || 0)/(s.total_enrollments || 1)*100, color:'var(--accent-purple)'},
          ].map(m => (
            <div key={m.label} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{fontSize:13,color:'var(--text-secondary)'}}>{m.label}</span>
                <span style={{fontSize:14,fontWeight:700}}>{m.value}</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{width:`${Math.min((m.progress !== undefined ? m.progress : (m.value/m.max)*100),100)}%`, background:m.color}} />
              </div>
            </div>
          ))}
        </div>

        {/* Sentiment Overview */}
        <div className="card">
          <h3 className="font-semibold mb-4">🤖 System Sentiment Overview</h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{fontSize:14}}>😊 Positive Feedback</span>
                <span style={{fontWeight:700, color:'var(--accent-green)'}}>{posPct}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{width:`${posPct}%`, background:'var(--accent-green)'}} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{fontSize:14}}>😐 Neutral Feedback</span>
                <span style={{fontWeight:700, color:'var(--accent-amber)'}}>{100-posPct-negPct}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{width:`${100-posPct-negPct}%`, background:'var(--accent-amber)'}} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{fontSize:14}}>😞 Negative Feedback</span>
                <span style={{fontWeight:700, color:'var(--accent-red)'}}>{negPct}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{width:`${negPct}%`, background:'var(--accent-red)'}} />
              </div>
            </div>
            <div style={{padding:'12px 16px',background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',marginTop:8}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Total analyzed: {sentimentTotal === 1 ? 0 : sentimentTotal} responses</div>
              <div style={{fontSize:13,color:'var(--text-secondary)'}}>
                System sentiment is {posPct >= 60 ? '✅ predominantly positive' : negPct >= 40 ? '⚠️ showing concerns' : '📊 balanced'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Courses + Quick Actions */}
      <div className="grid-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Top Active Courses</h3>
            <Link to="/admin/courses" className="btn btn-secondary btn-sm">Manage All</Link>
          </div>
          <table className="table">
            <thead><tr><th>Course</th><th>Teacher</th><th>Students</th><th>Feedback</th></tr></thead>
            <tbody>
              {s.top_courses?.map(c => (
                <tr key={c.code}>
                  <td><div style={{fontWeight:600}}>{c.title}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{c.code}</div></td>
                  <td style={{fontSize:13}}>{c.teacher || 'N/A'}</td>
                  <td>{c.students}</td>
                  <td>{c.feedback_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Quick Admin Actions</h3>
          <div className="flex flex-col gap-3">
            <Link to="/admin/users" style={{textDecoration:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:'pointer',transition:'var(--transition)'}}>
                <span style={{fontSize:24}}>👥</span>
                <div>
                  <div style={{fontWeight:600}}>Manage Users</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>Add, edit, or deactivate accounts</div>
                </div>
                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>→</span>
              </div>
            </Link>
            <Link to="/admin/courses" style={{textDecoration:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',cursor:'pointer',transition:'var(--transition)'}}>
                <span style={{fontSize:24}}>🎓</span>
                <div>
                  <div style={{fontWeight:600}}>Manage Courses</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>Create, assign, or remove courses</div>
                </div>
                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}