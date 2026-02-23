import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const StarRating = ({ value, onChange }) => (
  <div className="star-rating">
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" className={`star ${n <= value ? 'filled' : ''}`} onClick={() => onChange(n)}>★</button>
    ))}
    <span className="star-label">{value ? `${value}/5` : 'Click to rate'}</span>
  </div>
);

const ScaleInput = ({ options, value, onChange }) => {
  const min = options?.min || 1;
  const max = options?.max || 10;
  const labels = options?.labels || [];
  const range = Array.from({length: max - min + 1}, (_, i) => i + min);
  
  return (
    <div className="scale-input">
      <div className="scale-labels">
        <span>{labels[0] || min}</span>
        <span>{labels[1] || max}</span>
      </div>
      <div className="scale-buttons">
        {range.map(n => (
          <button key={n} type="button"
            className={`scale-btn ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(n)}
          >{n}</button>
        ))}
      </div>
    </div>
  );
};

export default function FeedbackForm() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/forms/${formId}`).then(r => {
      setForm(r.data);
      setIsAnonymous(!!r.data.is_anonymous);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [formId]);

  const setAnswer = (qId, text, value) => {
    setAnswers(prev => ({ ...prev, [qId]: { question_id: qId, text, value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required questions
    const missing = form.questions.filter(q => q.is_required && !answers[q.id]?.text && answers[q.id]?.value === undefined);
    if (missing.length > 0) {
      setError('Please answer all required questions');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/forms/${formId}/submit`, {
        is_anonymous: isAnonymous,
        answers: Object.values(answers).filter(a => a.text || a.value !== undefined)
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!form) return <div className="card"><p className="text-muted">Form not found</p></div>;

  if (submitted) {
    return (
      <div style={{maxWidth:600, margin:'60px auto', textAlign:'center'}}>
        <div className="card">
          <div style={{fontSize:64, marginBottom:20}}>🎉</div>
          <h2 style={{fontSize:24, fontWeight:800, marginBottom:8}}>Thank You!</h2>
          <p className="text-muted" style={{marginBottom:24}}>Your feedback has been submitted successfully. Your input helps improve the learning experience for everyone.</p>
          <div className="flex gap-3 justify-center">
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
            <button className="btn btn-primary" onClick={() => navigate('/student')}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth: 700, margin: '0 auto'}}>
      <div className="card mb-6" style={{background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))', borderColor:'rgba(59,130,246,0.2)'}}>
        <h1 style={{fontSize:24, fontWeight:800, marginBottom:6}}>{form.title}</h1>
        {form.description && <p className="text-muted">{form.description}</p>}
        <div className="flex gap-2 mt-3">
          <span className="badge badge-blue">{form.questions?.length || 0} questions</span>
          {form.is_anonymous && <span className="badge badge-purple">Anonymous by default</span>}
        </div>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Anonymous toggle */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Submission Mode</div>
              <div style={{fontSize:13, color:'var(--text-secondary)'}}>
                {isAnonymous ? 'Your identity will be hidden' : 'Your name will be attached to this response'}
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
              <span>{isAnonymous ? '🔒 Anonymous' : '👤 Identified'}</span>
            </label>
          </div>
        </div>

        {form.questions?.map((q, idx) => (
          <div key={q.id} className="card mb-4 question-card">
            <div className="question-header">
              <span className="question-num">{idx + 1}</span>
              <div>
                <p className="question-text">
                  {q.question_text}
                  {q.is_required && <span className="required-mark">*</span>}
                </p>
                <span className="badge badge-cyan" style={{marginTop:6, display:'inline-flex'}}>{q.question_type.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="question-answer">
              {q.question_type === 'text' && (
                <textarea
                  className="form-textarea"
                  placeholder="Type your response here..."
                  value={answers[q.id]?.text || ''}
                  onChange={e => setAnswer(q.id, e.target.value, null)}
                  rows={4}
                />
              )}

              {q.question_type === 'rating' && (
                <StarRating
                  value={answers[q.id]?.value || 0}
                  onChange={v => setAnswer(q.id, v.toString(), v)}
                />
              )}

              {q.question_type === 'scale' && (
                <ScaleInput
                  options={q.options}
                  value={answers[q.id]?.value}
                  onChange={v => setAnswer(q.id, v.toString(), v)}
                />
              )}

              {q.question_type === 'yes_no' && (
                <div className="yes-no-group">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} type="button"
                      className={`yn-btn ${answers[q.id]?.text === opt ? 'selected' : ''}`}
                      onClick={() => setAnswer(q.id, opt, opt === 'Yes' ? 1 : 0)}
                    >
                      {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === 'multiple_choice' && (
                <div className="mc-group">
                  {(Array.isArray(q.options) ? q.options : []).map(opt => (
                    <button key={opt} type="button"
                      className={`mc-btn ${answers[q.id]?.text === opt ? 'selected' : ''}`}
                      onClick={() => setAnswer(q.id, opt, null)}
                    >
                      <span className="mc-radio">{answers[q.id]?.text === opt ? '●' : '○'}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>← Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner" /> Submitting...</> : '📨 Submit Feedback'}
          </button>
        </div>
      </form>

      <style>{`
        .question-card { border-left: 3px solid var(--accent-blue); }
        .question-header { display: flex; gap: 14px; margin-bottom: 16px; align-items: flex-start; }
        .question-num { width: 28px; height: 28px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; margin-top: 2px; }
        .question-text { font-size: 16px; font-weight: 600; color: var(--text-primary); line-height: 1.4; }
        .required-mark { color: var(--accent-red); margin-left: 4px; }
        .question-answer { margin-left: 42px; }
        
        .star-rating { display: flex; align-items: center; gap: 8px; }
        .star { background: none; border: none; font-size: 32px; cursor: pointer; color: var(--text-muted); transition: var(--transition); }
        .star.filled { color: #f59e0b; }
        .star:hover { transform: scale(1.2); color: #f59e0b; }
        .star-label { font-size: 14px; color: var(--text-secondary); margin-left: 8px; }
        
        .scale-input { }
        .scale-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
        .scale-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
        .scale-btn { width: 40px; height: 40px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .scale-btn:hover { border-color: var(--accent-blue); background: rgba(59,130,246,0.1); }
        .scale-btn.selected { background: var(--gradient-primary); border-color: var(--accent-blue); color: white; }
        
        .yes-no-group { display: flex; gap: 12px; }
        .yn-btn { padding: 10px 28px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 15px; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .yn-btn:hover { border-color: var(--accent-blue); }
        .yn-btn.selected { background: var(--gradient-primary); border-color: transparent; color: white; }
        
        .mc-group { display: flex; flex-direction: column; gap: 8px; }
        .mc-btn { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; font-weight: 500; cursor: pointer; transition: var(--transition); text-align: left; }
        .mc-btn:hover { border-color: var(--accent-blue); background: rgba(59,130,246,0.05); }
        .mc-btn.selected { border-color: var(--accent-blue); background: rgba(59,130,246,0.12); color: #60a5fa; }
        .mc-radio { font-size: 16px; color: var(--accent-blue); }
        
        .toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .toggle input { display: none; }
        .toggle-track { width: 44px; height: 24px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 99px; position: relative; transition: var(--transition); }
        .toggle input:checked ~ .toggle-track { background: rgba(59,130,246,0.3); border-color: var(--accent-blue); }
        .toggle-thumb { width: 18px; height: 18px; background: var(--text-secondary); border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: var(--transition); }
        .toggle input:checked ~ .toggle-track .toggle-thumb { left: 22px; background: var(--accent-blue); }
      `}</style>
    </div>
  );
}