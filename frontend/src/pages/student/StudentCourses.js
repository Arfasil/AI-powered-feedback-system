import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/courses').then(r => { setCourses(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const enroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourses(cs => cs.map(c => c.id === courseId ? {...c, is_enrolled: 1, enrolled_count: c.enrolled_count + 1} : c));
      setMsg('Successfully enrolled!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message);
      setTimeout(() => setMsg(''), 3000);
    }
    setEnrolling(null);
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.5px'}}>Course Catalog</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>Browse and enroll in available courses</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes('Successfully') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      <div className="mb-6">
        <input
          className="form-input"
          placeholder="🔍 Search courses by name, code, or teacher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{maxWidth: 480}}
        />
      </div>

      <div className="tabs" style={{display:'inline-flex', marginBottom:24}}>
        <span style={{padding:'8px 16px', fontSize:13, color:'var(--text-secondary)'}}>
          {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="grid-3">
        {filtered.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-card-header">
              <div className="course-icon">{course.department?.[0] || '📚'}</div>
              <span className="badge badge-blue">{course.code}</span>
            </div>
            <h3 className="course-title">{course.title}</h3>
            <p className="course-desc">{course.description || 'No description available'}</p>
            <div className="course-meta">
              <span>👨‍🏫 {course.teacher_name || 'Unknown'}</span>
              <span>👥 {course.enrolled_count || 0} students</span>
            </div>
            <div className="course-meta" style={{marginTop:4}}>
              <span>📅 {course.semester} {course.year}</span>
              <span>🏛️ {course.department || 'N/A'}</span>
            </div>
            <div className="course-actions">
              {course.is_enrolled ? (
                <Link to={`/student/courses/${course.id}`} className="btn btn-success btn-sm btn-full">
                  ▶ Go to Course
                </Link>
              ) : (
                <button
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => enroll(course.id)}
                  disabled={enrolling === course.id}
                >
                  {enrolling === course.id ? <><span className="spinner" /> Enrolling...</> : '+ Enroll Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No courses found</div>
          <p className="text-muted">Try a different search term</p>
        </div>
      )}

      <style>{`
        .course-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; transition: var(--transition); display: flex; flex-direction: column; gap: 0; }
        .course-card:hover { border-color: var(--border-light); transform: translateY(-2px); box-shadow: var(--shadow-elevated); }
        .course-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .course-icon { width: 40px; height: 40px; background: var(--gradient-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
        .course-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; line-height: 1.3; }
        .course-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; flex: 1; }
        .course-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; margin-bottom: 4px; }
        .course-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
      `}</style>
    </div>
  );
}