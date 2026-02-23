import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const perf = data?.avg_performance || 0;
  const perfColor = perf >= 75 ? 'var(--accent-green)' : perf >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.5px'}}>Teacher Dashboard</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>Welcome back, {user?.full_name}</p>
        </div>
        <Link to="/teacher/courses" className="btn btn-primary">+ New Course</Link>
      </div>

      <div className="grid-4 mb-6">
        <div className="stat-card blue">
          <div className="stat-icon" style={{background:'rgba(59,130,246,0.15)'}}>📋</div>
          <div className="stat-value">{data?.total_courses || 0}</div>
          <div className="stat-label">Active Courses</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{background:'rgba(6,182,212,0.15)'}}>👥</div>
          <div className="stat-value">{data?.total_students || 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{background:'rgba(16,185,129,0.15)'}}>📝</div>
          <div className="stat-value">{data?.total_feedback || 0}</div>
          <div className="stat-label">Feedback Received</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>🎯</div>
          <div className="stat-value" style={{color: perfColor}}>{perf}%</div>
          <div className="stat-label">Avg Performance</div>
        </div>
      </div>

      {/* Performance meter */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Overall Performance Score</h3>
          <span className="font-mono text-lg" style={{color: perfColor, fontWeight:700}}>{perf}/100</span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{width:`${perf}%`, background: perfColor}} />
        </div>
        <div style={{fontSize:12, color:'var(--text-muted)', marginTop:8}}>
          Based on student ratings and sentiment analysis
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Course Performance Overview</h3>
          <Link to="/teacher/analytics" className="btn btn-secondary btn-sm">Full Analytics →</Link>
        </div>
        {data?.courses_analytics?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No data yet</div>
            <p className="text-muted">Start collecting feedback to see analytics</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Students</th>
                <th>Feedback</th>
                <th>Avg Rating</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.courses_analytics?.map(c => (
                <tr key={c.course_id}>
                  <td>
                    <div className="font-semibold" style={{color:'var(--text-primary)'}}>{c.course_title}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)'}}>{c.course_code}</div>
                  </td>
                  <td>{c.enrolled}</td>
                  <td>{c.feedback_count}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span style={{color:'#f59e0b'}}>★</span>
                      <span>{c.avg_rating || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress" style={{width:60}}>
                        <div className="progress-bar" style={{
                          width:`${c.performance_score}%`,
                          background: c.performance_score >= 75 ? 'var(--accent-green)' : c.performance_score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'
                        }} />
                      </div>
                      <span style={{fontSize:12, fontWeight:600}}>{c.performance_score}%</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/teacher/courses/${c.course_id}`} className="btn btn-secondary btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}