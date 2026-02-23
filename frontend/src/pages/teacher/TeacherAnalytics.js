import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const BarChart = ({ data, color = '#3b82f6' }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120}}>
      {data.map((d, i) => (
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>{d.value}</div>
          <div style={{
            width:'100%',
            height:`${(d.value/max)*100}px`,
            background:color,
            borderRadius:'4px 4px 0 0',
            transition:'height 0.5s ease',
            minHeight:4,
            opacity: 0.7 + (d.value/max)*0.3
          }} />
          <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',lineHeight:1.2}}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((a,b) => a + b.value, 0) || 1;
  let angle = -90;
  const size = 140;
  const cx = size/2, cy = size/2, r = 50, strokeW = 20;
  const circumference = 2 * Math.PI * r;

  const segments = data.map(d => {
    const pct = d.value / total;
    const dashLen = pct * circumference;
    const offset = -(angle/360) * circumference;
    angle += pct * 360;
    return { ...d, dashLen, offset, pct };
  });

  return (
    <div style={{display:'flex',alignItems:'center',gap:24}}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeW} />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
            strokeDashoffset={s.offset}
            style={{transition:'stroke-dasharray 0.8s ease'}}
          />
        ))}
        <text x={cx} y={cy-8} textAnchor="middle" fill="var(--text-primary)" fontSize={20} fontWeight={800}>{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>total</text>
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {data.map((d, i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}} />
            <span style={{fontSize:13,color:'var(--text-secondary)'}}>{d.label}</span>
            <span style={{fontSize:13,fontWeight:700,color:d.color,marginLeft:'auto'}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TeacherAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/analytics'),
      api.get(`/trends/${user.id}`)
    ]).then(([d, t]) => {
      setData(d.data);
      setTrends(t.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  const loadCourseAnalytics = (courseId) => {
    setSelectedCourse(courseId);
    api.get(`/courses/${courseId}/analytics`).then(r => setCourseAnalytics(r.data));
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const sentimentData = courseAnalytics ? [
    {label:'Positive', value: courseAnalytics.sentiment_distribution.positive, color:'var(--accent-green)'},
    {label:'Neutral', value: courseAnalytics.sentiment_distribution.neutral, color:'var(--accent-amber)'},
    {label:'Negative', value: courseAnalytics.sentiment_distribution.negative, color:'var(--accent-red)'},
  ] : [];

  const courseBarData = data?.courses_analytics?.map(c => ({
    label: c.course_code,
    value: c.performance_score
  })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 style={{fontSize:26,fontWeight:800}}>Analytics Dashboard</h1>
        <p className="text-muted text-sm" style={{marginTop:4}}>AI-powered insights from student feedback</p>
      </div>

      {/* Overview Stats */}
      <div className="grid-4 mb-6">
        <div className="stat-card blue"><div className="stat-value" style={{fontFamily:'var(--font-mono)'}}>{data?.total_courses || 0}</div><div className="stat-label">Total Courses</div></div>
        <div className="stat-card cyan"><div className="stat-value">{data?.total_students || 0}</div><div className="stat-label">Students</div></div>
        <div className="stat-card green"><div className="stat-value">{data?.total_feedback || 0}</div><div className="stat-label">Feedback Received</div></div>
        <div className="stat-card amber"><div className="stat-value">{data?.avg_performance || 0}%</div><div className="stat-label">Avg Performance</div></div>
      </div>

      <div className="grid-2 mb-6">
        {/* Performance by Course */}
        <div className="card">
          <h3 className="font-semibold mb-4">Performance by Course</h3>
          <BarChart data={courseBarData} color="#3b82f6" />
        </div>

        {/* Course Selector & Sentiment */}
        <div className="card">
          <h3 className="font-semibold mb-4">Course Sentiment Analysis</h3>
          <div className="form-group">
            <select className="form-select" value={selectedCourse || ''} onChange={e => loadCourseAnalytics(e.target.value)}>
              <option value="">Select a course...</option>
              {data?.courses_analytics?.map(c => <option key={c.course_id} value={c.course_id}>{c.course_title}</option>)}
            </select>
          </div>
          {courseAnalytics ? (
            <DonutChart data={sentimentData} />
          ) : (
            <div className="empty-state" style={{padding:20}}>
              <p className="text-muted text-sm">Select a course to see sentiment breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Course Analytics */}
      {courseAnalytics && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span style={{fontSize:20}}>🤖</span>
            <h3 className="font-semibold">AI Analysis for Selected Course</h3>
          </div>

          <div className="grid-2 mb-4">
            <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:16}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>AI SUMMARY</div>
              <p style={{fontSize:13,lineHeight:1.7,color:'var(--text-secondary)'}}>{courseAnalytics.summary}</p>
            </div>
            <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:16}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>TOP KEYWORDS</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {courseAnalytics.keywords?.slice(0,8).map(k => (
                  <span key={k.keyword} style={{padding:'2px 8px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:99,fontSize:11,color:'#60a5fa'}}>
                    {k.keyword} ({k.count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>💡 AI Improvement Suggestions</div>
            <div className="flex flex-col gap-3">
              {courseAnalytics.suggestions?.map((s, i) => {
                const pColors = {high:'var(--accent-red)',medium:'var(--accent-amber)',low:'var(--accent-green)'};
                return (
                  <div key={i} style={{padding:'12px 14px',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)',borderLeft:`3px solid ${pColors[s.priority]}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:pColors[s.priority],textTransform:'uppercase',marginBottom:4}}>{s.priority} — {s.category}</div>
                    <p style={{fontSize:13,color:'var(--text-secondary)'}}>{s.suggestion}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {trends.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">📈 Semester Trend Analysis</h3>
          <div className="grid-2">
            {trends.map(t => (
              <div key={t.code} style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:16}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{t.course} <span style={{color:'var(--text-muted)',fontWeight:400}}>({t.code})</span></div>
                {t.data.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <span style={{fontSize:12,color:'var(--text-muted)',width:120,flexShrink:0}}>{d.period}</span>
                    <div className="progress" style={{flex:1}}>
                      <div className="progress-bar" style={{width:`${(d.avg_rating/5)*100}%`,background:'var(--gradient-primary)'}} />
                    </div>
                    <span style={{fontSize:12,fontWeight:700,width:30,textAlign:'right'}}>{d.avg_rating}</span>
                    <span style={{fontSize:10,color:'var(--text-muted)'}}>({d.count})</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}