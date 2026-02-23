import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const INIT = { title:'', code:'', description:'', department:'', semester:'Fall', year:2024, teacher_id:'' };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const reload = () => Promise.all([
    api.get('/courses'),
    api.get('/teachers')
  ]).then(([c, t]) => { setCourses(c.data); setTeachers(t.data); setLoading(false); });

  useEffect(() => { reload(); }, []);

  const openCreate = () => { setForm(INIT); setEditCourse(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ title:c.title, code:c.code, description:c.description||'', department:c.department||'', semester:c.semester||'Fall', year:c.year||2024, teacher_id:c.teacher_id||'' });
    setEditCourse(c);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, form);
        showMsg('Course updated!');
      } else {
        await api.post('/courses', form);
        showMsg('Course created!');
      }
      setShowModal(false);
      reload();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    await api.delete(`/courses/${id}`);
    showMsg('Course deleted');
    reload();
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const upd = k => e => setForm({...form, [k]: e.target.value});

  const filtered = courses.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher_name||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800}}>Course Management</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>{courses.length} total courses</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Course</button>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}

      <div className="mb-4">
        <input className="form-input" style={{maxWidth:360}} placeholder="🔍 Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Course</th><th>Teacher</th><th>Semester</th><th>Students</th><th>Department</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{fontWeight:600}}>{c.title}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.code}</div>
                </td>
                <td style={{fontSize:13}}>{c.teacher_name || <span style={{color:'var(--accent-red)'}}>Unassigned</span>}</td>
                <td><span className="badge badge-blue">{c.semester} {c.year}</span></td>
                <td>{c.enrolled_count || 0}</td>
                <td style={{fontSize:13}}>{c.department || '—'}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No courses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>{editCourse ? 'Edit Course' : 'Create New Course'}</h2>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input className="form-input" value={form.title} onChange={upd('title')} required placeholder="Introduction to..." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input className="form-input" value={form.code} onChange={upd('code')} required placeholder="CS501" disabled={!!editCourse} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={upd('department')} placeholder="Computer Science" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Teacher</label>
                <select className="form-select" value={form.teacher_id} onChange={upd('teacher_id')}>
                  <option value="">— No Teacher —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.username} ({t.department || 'N/A'})</option>)}
                </select>
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
                  {saving ? <><span className="spinner" /> Saving...</> : editCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}