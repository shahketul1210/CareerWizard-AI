import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

const CustomCheckCircle = ({ size = 18, strokeWidth = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default function InternshipTasks() {
  const { isDark } = useContext(ThemeContext);
  const [filter, setFilter] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalGit, setModalGit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async (filterVal = 'all') => {
    try {
      setLoading(true);
      const data = await internshipApi.getTasks(filterVal);
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(filter);
  }, [filter]);

  const handleModalSubmit = async () => {
    if (!modalGit) {
      alert('Please paste your GitHub repository URL!');
      return;
    }
    if (!modalGit.startsWith('http')) {
      alert('Please enter a valid GitHub URL (https://github.com/...)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await internshipApi.submitTask({
        dayNumber: selectedTask.day,
        githubUrl: modalGit,
        difficultyChosen: selectedTask.level ? selectedTask.level.toLowerCase() : 'intermediate',
        taskId: selectedTask.id
      });
      alert(`🎉 Task Day ${selectedTask.day} Submitted! AI Score: ${res.total_score}/100.`);
      setModalGit('');
      setSelectedTask(null);
      await fetchTasks(filter);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl p-6 transition border ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
        <div className="cw-card-header">
          <div className={`cw-card-title ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontSize: 20 }}>
            <i className={`fa-solid fa-list-check ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
            <span>Assigned Internship Tasks (15 Days)</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'completed', 'active', 'ml', 'deeplearning', 'deployment'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition border ${
                  filter === f
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark
                    ? 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                    : 'bg-[var(--cw-bg2)] text-[var(--cw-text)] border-[var(--cw-border)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.day}
              onClick={() => setSelectedTask(task)}
              className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                isDark
                  ? 'border-white/5 hover:border-[var(--gold)]/30 hover:bg-white/[0.02]'
                  : 'border-black/5 hover:border-[var(--gold)]/30 bg-transparent hover:bg-black/[0.02]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: task.status === 'done'
                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.12)')
                    : task.status === 'active'
                    ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.12)')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: task.status === 'done' ? '#22c55e' : task.status === 'active' ? '#60a5fa' : (isDark ? '#94a3b8' : 'var(--cw-muted)'),
                  fontSize: 18
                }}>
                  {task.status === 'done' ? <CustomCheckCircle size={20} strokeWidth={2.5} /> : <i className={`fa-solid ${task.status === 'active' ? 'fa-bolt' : 'fa-lock'}`} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#ffffff' : 'inherit' }}>
                    Day {task.day} — {task.title}
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginTop: 2 }}>
                    {task.domain.toUpperCase()} · {task.level} · {(task.tags || []).join(', ')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {task.score && (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'cw-badge cw-badge-green'}`}>
                    Score: {task.score}/100
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border font-mono ${
                  task.status === 'done'
                    ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'cw-badge cw-badge-green')
                    : task.status === 'active'
                    ? (isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'cw-badge cw-badge-amber')
                    : (isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'cw-badge cw-badge-secondary')
                }`}>
                  {task.status === 'done' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CustomCheckCircle size={14} strokeWidth={2.8} /> DONE
                    </span>
                  ) : task.status === 'active' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-bolt" style={{ fontSize: 10 }} /> ACTIVE
                    </span>
                  ) : (
                    task.status.toUpperCase()
                  )}
                </span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && !loading && (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
              No tasks match the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedTask && (
        <div className="cw-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="cw-modal-content" style={isDark ? { background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' } : {}} onClick={e => e.stopPropagation()}>
            <div className="cw-modal-header" style={isDark ? { borderColor: 'rgba(255,255,255,0.08)' } : {}}>
              <div className="cw-modal-title" style={isDark ? { color: '#ffffff' } : {}}>
                Day {selectedTask.day} — {selectedTask.title}
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : 'var(--cw-text)', fontSize: 18, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div className="cw-modal-body space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(selectedTask.tags || []).map(t => (
                  <span key={t} className="cw-tag" style={isDark ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1' } : {}}>{t}</span>
                ))}
              </div>
              <p style={{ fontSize: 13, color: isDark ? '#cbd5e1' : 'var(--cw-text2)', lineHeight: 1.6 }}>
                {selectedTask.description || `This is the complete assignment outline for Day ${selectedTask.day}. It tests your domain expertise on ${(selectedTask.tags || []).join(', ')} using automated logic evaluation protocols.`}
              </p>

              {/* Requirements preview */}
              {selectedTask.inter_reqs && selectedTask.inter_reqs.length > 0 && (
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/10 text-slate-300' : 'bg-[#f2eee1] border-[var(--cw-border)]'}`}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: isDark ? '#ffffff' : 'inherit' }}>Core Technical Requirements:</div>
                  <ul className={`space-y-1 text-xs ${isDark ? 'text-slate-300' : 'text-[var(--cw-text2)]'}`}>
                    {selectedTask.inter_reqs.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTask.score ? (
                <div style={{ padding: 14, background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)', borderRadius: 10, border: `1px solid ${isDark ? '#22c55e' : '#16a34a'}` }}>
                  <div style={{ fontWeight: 700, color: isDark ? '#4ade80' : '#16a34a', fontSize: 13 }}>Passing Assessment Checked</div>
                  <p style={{ fontSize: 12, color: isDark ? '#cbd5e1' : 'var(--cw-text2)', marginTop: 4 }}>
                    Score: {selectedTask.score}/100. Feedback: The model implementation meets all technical rubric standards and code passes automated evaluation benchmarks.
                  </p>
                </div>
              ) : selectedTask.status !== 'locked' ? (
                <div className="cw-submit-box" style={isDark ? { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' } : {}}>
                  <div className="cw-submit-label" style={isDark ? { color: '#94a3b8' } : {}}>PASTE GITHUB URL</div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="text-input"
                      placeholder="https://github.com/username/ai-ml-repo"
                      value={modalGit}
                      onChange={e => setModalGit(e.target.value)}
                      style={isDark ? { background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' } : {}}
                    />
                    <button
                      className="cw-btn cw-btn-primary cw-btn-sm"
                      disabled={isSubmitting}
                      onClick={handleModalSubmit}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: isDark ? '#94a3b8' : 'var(--cw-muted)', fontStyle: 'italic', fontSize: 13 }}>
                  This task is currently locked. Complete preceding day milestones to unlock.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
