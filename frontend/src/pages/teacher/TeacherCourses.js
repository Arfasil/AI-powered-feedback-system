import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const INITIAL_FORM = { title: '', code: '', description: '', semester: 'Fall', year: 2024, department: '' };

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/courses').then(r => { setCourses(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await api.post('/courses', form);
      setMsg('Course created successfully!');
      setShowModal(false);
      setForm(INITIAL_FORM);
      api.get('/courses').then(r => setCourses(r.data));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const upd = k => e => setForm({...form, [k]: e.target.value});

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800}}>My Courses</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>Manage your courses and course materials</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Course</button>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No courses yet</div>
          <p className="text-muted mb-4">Create your first course to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Course</button>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map(course => (
            <div key={course.id} className="card" style={{transition:'var(--transition)'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-blue">{course.code}</span>
                <span className="badge badge-green">{course.semester} {course.year}</span>
              </div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:6,color:'var(--text-primary)'}}>{course.title}</h3>
              <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:12}}>{course.description || 'No description'}</p>
              <div style={{display:'flex',gap:16,fontSize:12,color:'var(--text-muted)',marginBottom:16}}>
                <span>👥 {course.enrolled_count || 0} students</span>
                <span>🏛️ {course.department || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <Link to={`/teacher/courses/${course.id}`} className="btn btn-primary btn-sm" style={{flex:1, justifyContent:'center'}}>Manage →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>Create New Course</h2>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input className="form-input" value={form.title} onChange={upd('title')} placeholder="Introduction to..." required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input className="form-input" value={form.code} onChange={upd('code')} placeholder="CS501" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={upd('department')} placeholder="Computer Science" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={form.semester} onChange={upd('semester')}>
                    {['Fall','Spring','Summer','Winter'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" value={form.year} onChange={upd('year')} min={2020} max={2030} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={upd('description')} placeholder="Course description..." rows={3} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creating...</> : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}