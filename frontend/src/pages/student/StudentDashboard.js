import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then(r => {
      setCourses(r.data.filter(c => c.is_enrolled));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const enrolledCourses = courses.filter(c => c.is_enrolled);
  const pendingFeedback = enrolledCourses.filter(c => c.feedback_forms?.length > 0).length;

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 👋</h1>
          <p className="page-subtitle">Here's an overview of your academic activity</p>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <div className="stat-card blue">
          <div className="stat-icon" style={{background:'rgba(59,130,246,0.15)'}}>📚</div>
          <div className="stat-value">{enrolledCourses.length}</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{background:'rgba(16,185,129,0.15)'}}>✅</div>
          <div className="stat-value">{enrolledCourses.length}</div>
          <div className="stat-label">Active This Semester</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>📝</div>
          <div className="stat-value">{pendingFeedback}</div>
          <div className="stat-label">Pending Feedback</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{background:'rgba(6,182,212,0.15)'}}>🎯</div>
          <div className="stat-value">0</div>
          <div className="stat-label">Submitted Feedback</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-header mb-4">
            <h2 className="section-title">My Courses</h2>
            <Link to="/student/courses" className="btn btn-secondary btn-sm">Browse All</Link>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <div className="empty-state-title">No courses yet</div>
                <p className="text-muted text-sm">Browse and enroll in courses to get started</p>
                <Link to="/student/courses" className="btn btn-primary mt-4">Browse Courses</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {enrolledCourses.slice(0,4).map(course => (
                <Link key={course.id} to={`/student/courses/${course.id}`} style={{textDecoration:'none'}}>
                  <div className="card course-card-mini">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold" style={{color:'var(--text-primary)', marginBottom:4}}>{course.title}</div>
                        <div className="text-sm text-muted">{course.code} • {course.teacher_name || 'Unknown Teacher'}</div>
                      </div>
                      <span className="badge badge-blue">{course.semester} {course.year}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="section-header mb-4">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-4">
            <Link to="/student/courses" style={{textDecoration:'none'}}>
              <div className="action-card">
                <div className="action-icon" style={{background:'var(--gradient-cyan)'}}>🔍</div>
                <div>
                  <div className="font-semibold" style={{color:'var(--text-primary)'}}>Browse Courses</div>
                  <div className="text-sm text-muted">Find and enroll in new courses</div>
                </div>
                <span style={{marginLeft:'auto', color:'var(--text-muted)'}}>→</span>
              </div>
            </Link>

            {enrolledCourses.slice(0,2).map(course => (
              <Link key={course.id} to={`/student/courses/${course.id}`} style={{textDecoration:'none'}}>
                <div className="action-card">
                  <div className="action-icon" style={{background:'var(--gradient-primary)'}}>📝</div>
                  <div>
                    <div className="font-semibold" style={{color:'var(--text-primary)'}}>Submit Feedback</div>
                    <div className="text-sm text-muted">{course.title}</div>
                  </div>
                  <span style={{marginLeft:'auto', color:'var(--text-muted)'}}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .page-header { }
        .page-title { font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; }
        .section-title { font-size: 17px; font-weight: 700; color: var(--text-primary); }
        .course-card-mini { transition: var(--transition); cursor: pointer; }
        .course-card-mini:hover { border-color: var(--accent-blue); transform: translateY(-1px); }
        .action-card { display: flex; align-items: center; gap: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px 20px; cursor: pointer; transition: var(--transition); }
        .action-card:hover { border-color: var(--accent-blue); background: var(--bg-elevated); transform: translateY(-1px); }
        .action-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}