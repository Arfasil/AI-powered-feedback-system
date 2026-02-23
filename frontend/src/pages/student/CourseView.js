import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function CourseView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get(`/courses/${courseId}`).then(r => { setCourse(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!course) return <div className="card"><p className="text-muted">Course not found</p></div>;

  const videos = (course.materials || []).filter(m => m.type === 'video');
  const docs = (course.materials || []).filter(m => m.type === 'document');

  return (
    <div>
      {/* Course Hero */}
      <div className="course-hero card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex gap-2 mb-2">
              <span className="badge badge-blue">{course.code}</span>
              <span className="badge badge-green">{course.semester} {course.year}</span>
            </div>
            <h1 style={{fontSize:26,fontWeight:800,marginBottom:8}}>{course.title}</h1>
            <p className="text-muted">{course.description}</p>
            <div className="flex gap-4 mt-4" style={{fontSize:13,color:'var(--text-secondary)'}}>
              <span>👨‍🏫 {course.teacher_name}</span>
              <span>🏛️ {course.department}</span>
              <span>👥 {course.enrolled_count} enrolled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview','videos','documents','feedback'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'videos' ? '🎬 ' : t === 'documents' ? '📄 ' : t === 'feedback' ? '📝 ' : '📋 '}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'videos' && videos.length > 0 && <span className="badge badge-blue ml-1" style={{marginLeft:6}}>{videos.length}</span>}
            {t === 'documents' && docs.length > 0 && <span className="badge badge-purple ml-1" style={{marginLeft:6}}>{docs.length}</span>}
            {t === 'feedback' && course.feedback_forms?.length > 0 && <span className="badge badge-amber ml-1" style={{marginLeft:6}}>{course.feedback_forms.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="font-semibold mb-4">Course Information</h3>
            <table style={{width:'100%',fontSize:14}}>
              <tbody>
                {[
                  ['Instructor', course.teacher_name],
                  ['Department', course.department],
                  ['Semester', `${course.semester} ${course.year}`],
                  ['Course Code', course.code],
                  ['Videos', videos.length],
                  ['Documents', docs.length],
                ].map(([k,v]) => (
                  <tr key={k}>
                    <td style={{padding:'8px 0',color:'var(--text-muted)',width:'40%'}}>{k}</td>
                    <td style={{padding:'8px 0',color:'var(--text-primary)',fontWeight:500}}>{v || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">Course Resources</h3>
            <div className="flex flex-col gap-3">
              <div className="resource-item" onClick={() => setTab('videos')}>
                <div className="resource-icon" style={{background:'rgba(59,130,246,0.15)', color:'#60a5fa'}}>🎬</div>
                <div>
                  <div className="font-semibold text-sm">Video Lectures</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{videos.length} video{videos.length !== 1?'s':''} available</div>
                </div>
                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>→</span>
              </div>
              <div className="resource-item" onClick={() => setTab('documents')}>
                <div className="resource-icon" style={{background:'rgba(139,92,246,0.15)', color:'#a78bfa'}}>📄</div>
                <div>
                  <div className="font-semibold text-sm">Documents</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{docs.length} document{docs.length !== 1?'s':''} available</div>
                </div>
                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>→</span>
              </div>
              <div className="resource-item" onClick={() => setTab('feedback')}>
                <div className="resource-icon" style={{background:'rgba(245,158,11,0.15)', color:'#fbbf24'}}>📝</div>
                <div>
                  <div className="font-semibold text-sm">Feedback Forms</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{course.feedback_forms?.length || 0} form{course.feedback_forms?.length !== 1?'s':''}</div>
                </div>
                <span style={{marginLeft:'auto',color:'var(--text-muted)'}}>→</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'videos' && (
        <div>
          {videos.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🎬</div><div className="empty-state-title">No videos yet</div><p className="text-muted">Your instructor hasn't uploaded any videos yet</p></div>
          ) : (
            <div className="grid-2">
              {videos.map(v => (
                <div key={v.id} className="card">
                  <div style={{position:'relative', paddingBottom:'56.25%', marginBottom:16, borderRadius:'var(--radius-md)', overflow:'hidden', background:'#000'}}>
                    {v.url ? (
                      <iframe src={v.url} style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}} allowFullScreen title={v.title} />
                    ) : (
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}>No video URL</div>
                    )}
                  </div>
                  <h4 className="font-semibold mb-1">{v.title}</h4>
                  <p style={{fontSize:13,color:'var(--text-secondary)'}}>{v.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div>
          {docs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-title">No documents yet</div></div>
          ) : (
            <div className="grid-3">
              {docs.map(d => (
                <div key={d.id} className="card">
                  <div style={{fontSize:40,marginBottom:12}}>📄</div>
                  <h4 className="font-semibold mb-1">{d.title}</h4>
                  <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16}}>{d.description}</p>
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-full">Download ↓</a>
                  ) : (
                    <button className="btn btn-secondary btn-sm btn-full" disabled>No file attached</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'feedback' && (
        <div>
          {!course.feedback_forms?.length ? (
            <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-title">No feedback forms available</div></div>
          ) : (
            <div className="grid-2">
              {course.feedback_forms.map(form => (
                <div key={form.id} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{fontSize:28}}>📋</div>
                    <div>
                      <h4 className="font-semibold">{form.title}</h4>
                      <p style={{fontSize:13,color:'var(--text-secondary)'}}>{form.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {form.is_anonymous ? <span className="badge badge-purple">Anonymous</span> : <span className="badge badge-blue">Identified</span>}
                  </div>
                  <Link to={`/student/feedback/${form.id}`} className="btn btn-primary btn-sm btn-full">
                    📝 Submit Feedback
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .course-hero { background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%); border-color: rgba(59,130,246,0.2); }
        .resource-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); cursor: pointer; transition: var(--transition); }
        .resource-item:hover { border-color: var(--accent-blue); background: rgba(59,130,246,0.05); }
        .resource-icon { width: 38px; height: 38px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}