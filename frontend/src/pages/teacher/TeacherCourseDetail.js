import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';

const QUESTION_TYPES = [
  {value:'text', label:'Text Response'},
  {value:'rating', label:'Star Rating (1-5)'},
  {value:'scale', label:'Scale (1-10)'},
  {value:'yes_no', label:'Yes / No'},
  {value:'multiple_choice', label:'Multiple Choice'},
];

export default function TeacherCourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showMatModal, setShowMatModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [matForm, setMatForm] = useState({title:'', type:'video', url:'', description:''});
  const [fbForm, setFbForm] = useState({title:'', description:'', is_anonymous:false, questions:[]});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const reload = () => api.get(`/courses/${courseId}`).then(r => setCourse(r.data));

  useEffect(() => {
    reload().then(() => setLoading(false)).catch(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (tab === 'analytics') {
      setLoadingAnalytics(true);
      api.get(`/courses/${courseId}/analytics`)
        .then(r => { setAnalytics(r.data); setLoadingAnalytics(false); })
        .catch(() => setLoadingAnalytics(false));
    }
  }, [tab, courseId]);

  const addMaterial = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/courses/${courseId}/materials`, matForm);
      await reload();
      setShowMatModal(false);
      setMatForm({title:'', type:'video', url:'', description:''});
      showAlert('Material added!', true);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const deleteMaterial = async (matId) => {
    if (!window.confirm('Delete this material?')) return;
    await api.delete(`/materials/${matId}`);
    await reload();
    showAlert('Deleted', true);
  };

  const addQuestion = () => setFbForm(f => ({...f, questions: [...f.questions, {text:'', type:'text', options:[], required:true}]}));
  const removeQuestion = (i) => setFbForm(f => ({...f, questions: f.questions.filter((_,j) => j !== i)}));
  const updateQuestion = (i, field, val) => setFbForm(f => ({...f, questions: f.questions.map((q, j) => j === i ? {...q, [field]: val} : q)}));

  const createForm = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/courses/${courseId}/forms`, {...fbForm, questions: fbForm.questions.map(q => ({text:q.text, type:q.type, options:q.options, required:q.required}))});
      await reload();
      setShowFormModal(false);
      setFbForm({title:'', description:'', is_anonymous:false, questions:[]});
      showAlert('Feedback form created!', true);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const showAlert = (m, success=true) => {
    if (success) setMsg(m); else setError(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!course) return <div className="card"><p>Not found</p></div>;

  const videos = (course.materials || []).filter(m => m.type === 'video');
  const docs = (course.materials || []).filter(m => m.type === 'document');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="badge badge-blue">{course.code}</span>
            <span className="badge badge-green">{course.semester} {course.year}</span>
          </div>
          <h1 style={{fontSize:24,fontWeight:800}}>{course.title}</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>{course.enrolled_count} students enrolled</p>
        </div>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}
      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="tabs">
        {['overview','materials','feedback-forms','analytics'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'materials' ? '📁 ' : t === 'feedback-forms' ? '📋 ' : t === 'analytics' ? '📊 ' : '📝 '}
            {t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="font-semibold mb-4">Course Details</h3>
            {[['Title', course.title],['Code', course.code],['Department', course.department],['Semester', `${course.semester} ${course.year}`],['Students Enrolled', course.enrolled_count],['Videos', videos.length],['Documents', docs.length],['Feedback Forms', course.feedback_forms?.length || 0]].map(([k,v]) => (
              <div key={k} className="flex justify-between" style={{padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:14}}>
                <span style={{color:'var(--text-muted)'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button className="btn btn-secondary" onClick={() => { setTab('materials'); setShowMatModal(true); }}>+ Add Video/Document</button>
              <button className="btn btn-secondary" onClick={() => { setTab('feedback-forms'); setShowFormModal(true); }}>+ Create Feedback Form</button>
              <button className="btn btn-secondary" onClick={() => setTab('analytics')}>📊 View Analytics</button>
            </div>
          </div>
        </div>
      )}

      {/* Materials */}
      {tab === 'materials' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Course Materials</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMatModal(true)}>+ Add Material</button>
          </div>
          {course.materials?.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📁</div><div className="empty-state-title">No materials yet</div><button className="btn btn-primary mt-4" onClick={() => setShowMatModal(true)}>Add First Material</button></div>
          ) : (
            <div className="grid-2">
              {course.materials.map(m => (
                <div key={m.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span style={{fontSize:24}}>{m.type === 'video' ? '🎬' : '📄'}</span>
                      <span className={`badge ${m.type === 'video' ? 'badge-blue' : 'badge-purple'}`}>{m.type}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMaterial(m.id)}>Delete</button>
                  </div>
                  <h4 className="font-semibold mb-1">{m.title}</h4>
                  <p style={{fontSize:13, color:'var(--text-secondary)'}}>{m.description}</p>
                  {m.url && <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🔗 {m.url}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Forms */}
      {tab === 'feedback-forms' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Feedback Forms</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFormModal(true)}>+ Create Form</button>
          </div>
          {!course.feedback_forms?.length ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No forms yet</div><button className="btn btn-primary mt-4" onClick={() => setShowFormModal(true)}>Create First Form</button></div>
          ) : (
            <div className="grid-2">
              {course.feedback_forms.map(f => (
                <div key={f.id} className="card">
                  <h4 className="font-semibold mb-2">{f.title}</h4>
                  <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:12}}>{f.description}</p>
                  <div className="flex gap-2">
                    {f.is_anonymous ? <span className="badge badge-purple">Anonymous</span> : <span className="badge badge-blue">Identified</span>}
                    <span className={`badge ${f.is_active ? 'badge-green' : 'badge-red'}`}>{f.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics */}
      {tab === 'analytics' && (
        <div>
          {loadingAnalytics ? <div className="page-loader"><div className="spinner" /></div> : analytics ? (
            <div>
              <div className="grid-4 mb-6">
                <div className="stat-card blue"><div className="stat-icon" style={{background:'rgba(59,130,246,0.15)'}}>👥</div><div className="stat-value">{analytics.enrolled_count}</div><div className="stat-label">Students</div></div>
                <div className="stat-card green"><div className="stat-icon" style={{background:'rgba(16,185,129,0.15)'}}>📝</div><div className="stat-value">{analytics.response_count}</div><div className="stat-label">Responses</div></div>
                <div className="stat-card amber"><div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>⭐</div><div className="stat-value">{analytics.avg_rating || 'N/A'}</div><div className="stat-label">Avg Rating</div></div>
                <div className="stat-card cyan"><div className="stat-icon" style={{background:'rgba(6,182,212,0.15)'}}>🎯</div><div className="stat-value">{analytics.performance_score}%</div><div className="stat-label">Performance</div></div>
              </div>

              {/* AI Summary */}
              <div className="card mb-4" style={{borderLeft:'3px solid var(--accent-blue)'}}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{fontSize:20}}>🤖</span>
                  <h3 className="font-semibold">AI-Generated Summary</h3>
                  <span className="badge badge-blue">AI Analysis</span>
                </div>
                <p style={{fontSize:14, lineHeight:1.7, color:'var(--text-secondary)'}}>{analytics.summary}</p>
              </div>

              <div className="grid-2 mb-4">
                {/* Sentiment */}
                <div className="card">
                  <h3 className="font-semibold mb-4">Sentiment Distribution</h3>
                  {['positive','neutral','negative'].map(s => {
                    const count = analytics.sentiment_distribution[s] || 0;
                    const total = analytics.total_feedback || 1;
                    const pct = Math.round(count/total*100);
                    const colors = {positive:'var(--accent-green)',neutral:'var(--accent-amber)',negative:'var(--accent-red)'};
                    const icons = {positive:'😊',neutral:'😐',negative:'😞'};
                    return (
                      <div key={s} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{fontSize:14,textTransform:'capitalize'}}>{icons[s]} {s}</span>
                          <span style={{fontSize:12,fontWeight:600,color:colors[s]}}>{count} ({pct}%)</span>
                        </div>
                        <div className="progress">
                          <div className="progress-bar" style={{width:`${pct}%`, background:colors[s]}} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Keywords */}
                <div className="card">
                  <h3 className="font-semibold mb-4">🔑 Top Keywords</h3>
                  {analytics.keywords?.length ? (
                    <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                      {analytics.keywords.map(k => (
                        <div key={k.keyword} style={{
                          padding:'4px 10px',
                          background:'rgba(59,130,246,0.1)',
                          border:'1px solid rgba(59,130,246,0.25)',
                          borderRadius:99,
                          fontSize:12,
                          color:'#60a5fa',
                          display:'flex', gap:6, alignItems:'center'
                        }}>
                          {k.keyword} <span style={{opacity:0.7}}>×{k.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted text-sm">No keywords extracted yet</p>}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{fontSize:20}}>💡</span>
                  <h3 className="font-semibold">AI Improvement Suggestions</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {analytics.suggestions?.map((s, i) => {
                    const pColors = {high:'var(--accent-red)',medium:'var(--accent-amber)',low:'var(--accent-green)'};
                    return (
                      <div key={i} style={{padding:'14px 16px', background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', borderLeft:`3px solid ${pColors[s.priority]}`}}>
                        <div className="flex items-center gap-2 mb-2">
                          <span style={{fontSize:12, fontWeight:700, color:pColors[s.priority], textTransform:'uppercase'}}>{s.priority} priority</span>
                          <span className="badge badge-cyan">{s.category}</span>
                        </div>
                        <p style={{fontSize:14, color:'var(--text-secondary)', lineHeight:1.6}}>{s.suggestion}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No analytics yet</div><p className="text-muted">Collect feedback first to see analytics</p></div>}
        </div>
      )}

      {/* Add Material Modal */}
      {showMatModal && (
        <div className="modal-overlay" onClick={() => setShowMatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>Add Course Material</h2>
            <form onSubmit={addMaterial}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={matForm.title} onChange={e => setMatForm({...matForm,title:e.target.value})} required placeholder="Material title" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={matForm.type} onChange={e => setMatForm({...matForm,type:e.target.value})}>
                  <option value="video">🎬 Video</option>
                  <option value="document">📄 Document</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{matForm.type === 'video' ? 'Video URL (YouTube embed)' : 'File URL'}</label>
                <input className="form-input" value={matForm.url} onChange={e => setMatForm({...matForm,url:e.target.value})} placeholder={matForm.type === 'video' ? 'https://www.youtube.com/embed/...' : 'https://...'} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={matForm.description} onChange={e => setMatForm({...matForm,description:e.target.value})} placeholder="Optional description" rows={2} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" style={{maxWidth:680}} onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>Create Feedback Form</h2>
            <form onSubmit={createForm}>
              <div className="form-group">
                <label className="form-label">Form Title *</label>
                <input className="form-input" value={fbForm.title} onChange={e => setFbForm({...fbForm,title:e.target.value})} required placeholder="Mid-Semester Feedback" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={fbForm.description} onChange={e => setFbForm({...fbForm,description:e.target.value})} placeholder="Instructions for students" rows={2} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="anon" checked={fbForm.is_anonymous} onChange={e => setFbForm({...fbForm,is_anonymous:e.target.checked})} />
                <label htmlFor="anon" style={{fontSize:14,cursor:'pointer'}}>Anonymous submissions only</label>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Questions ({fbForm.questions.length})</h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>+ Add Question</button>
              </div>

              {fbForm.questions.map((q, i) => (
                <div key={i} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:16,marginBottom:12,border:'1px solid var(--border)'}}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{fontSize:12,fontWeight:700,color:'var(--text-muted)'}}>Q{i+1}</span>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(i)}>×</button>
                  </div>
                  <div className="form-group">
                    <input className="form-input" value={q.text} onChange={e => updateQuestion(i,'text',e.target.value)} placeholder="Question text..." />
                  </div>
                  <div className="grid-2">
                    <select className="form-select" value={q.type} onChange={e => updateQuestion(i,'type',e.target.value)}>
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i,'required',e.target.checked)} id={`req-${i}`} />
                      <label htmlFor={`req-${i}`} style={{fontSize:13}}>Required</label>
                    </div>
                  </div>
                  {q.type === 'multiple_choice' && (
                    <div className="form-group mt-2">
                      <input className="form-input" placeholder="Option 1, Option 2, Option 3..."
                        value={Array.isArray(q.options) ? q.options.join(', ') : ''}
                        onChange={e => updateQuestion(i,'options',e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !fbForm.title}>
                  {saving ? 'Creating...' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}