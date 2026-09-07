import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

export default function InternshipProjects() {
  const { isDark } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [stack, setStack] = useState('');
  const [target, setTarget] = useState('15-day plan');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await internshipApi.getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await internshipApi.createProject({
        name,
        stack,
        target_timeline: target,
        description: desc
      });
      setProjects(prev => [res, ...prev]);
      setName('');
      setStack('');
      setDesc('');
      setShowAdd(false);
    } catch (err) {
      alert('Failed to save project. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl p-6 transition border ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
        <div className="cw-card-header">
          <div className={`cw-card-title ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontSize: 20 }}>
            <i className={`fa-solid fa-folder-open ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
            <span>My Custom Parallel Projects</span>
          </div>
          <button className="cw-btn cw-btn-primary cw-btn-sm" onClick={() => setShowAdd(true)}>
            + Add Personal Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border space-y-4 transition ${isDark ? 'border-white/5 bg-white/[0.02] hover:border-[var(--gold)]/30 hover:bg-white/[0.04] text-white' : 'border-black/5 bg-transparent hover:border-[var(--gold)]/30 hover:bg-black/[0.02]'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: '"EB Garamond", "Cormorant Garamond", serif', color: isDark ? '#ffffff' : 'inherit' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginTop: 2 }}>{p.stack} · {p.target}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border font-mono ${isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'cw-badge cw-badge-purple'}`}>My Project</span>
              </div>
              <p style={{ fontSize: 13, color: isDark ? '#cbd5e1' : 'var(--cw-text2)' }}>{p.desc || 'No description supplied yet.'}</p>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginBottom: 6 }}>
                  <span>ACCELERATION PROGRESS</span>
                  <span style={{ fontWeight: 700, color: isDark ? '#ffffff' : 'inherit' }}>{p.progress}%</span>
                </div>
                <div className="cw-progress-track" style={isDark ? { background: 'rgba(255,255,255,0.06)' } : {}}>
                  <div className="cw-progress-fill" style={{ width: `${p.progress}%`, background: isDark ? '#a855f7' : 'var(--cw-purple-mid)' }} />
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && !loading && (
            <div className={`col-span-2 text-center py-8 text-sm ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
              No personal projects yet. Click "+ Add Personal Project" to track your work!
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="cw-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="cw-modal-content" style={isDark ? { background: '#0e0e0e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' } : {}} onClick={e => e.stopPropagation()}>
            <div className="cw-modal-header" style={isDark ? { borderColor: 'rgba(255,255,255,0.08)' } : {}}>
              <div className="cw-modal-title" style={isDark ? { color: '#ffffff' } : {}}>Track a New Project</div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : 'var(--cw-text)', fontSize: 18, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProject} className="cw-modal-body space-y-4">
              <div className="space-y-1">
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : 'inherit' }}>PROJECT NAME</label>
                <input type="text" className="text-input" placeholder="e.g. Portfolio Website" value={name} onChange={e => setName(e.target.value)} required style={isDark ? { background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' } : {}} />
              </div>
              <div className="space-y-1">
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : 'inherit' }}>TECH STACK</label>
                <input type="text" className="text-input" placeholder="e.g. PyTorch, FastAPI, Streamlit" value={stack} onChange={e => setStack(e.target.value)} style={isDark ? { background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' } : {}} />
              </div>
              <div className="space-y-1">
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : 'inherit' }}>TARGET TIMELINE</label>
                <select className="select-input" style={isDark ? { width: '100%', background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' } : { width: '100%' }} value={target} onChange={e => setTarget(e.target.value)}>
                  <option value="15-day plan">15-day plan</option>
                  <option value="30-day plan">30-day plan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : 'inherit' }}>DESCRIPTION</label>
                <textarea className="textarea-input" placeholder="Summarize features..." value={desc} onChange={e => setDesc(e.target.value)} style={isDark ? { background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff' } : {}} />
              </div>
              <button type="submit" className="cw-btn cw-btn-primary cw-btn-full">
                Add Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
