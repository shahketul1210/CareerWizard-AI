import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

export default function InternshipResources() {
  const { isDark } = useContext(ThemeContext);
  const [resources, setResources] = useState([
    { name: 'AI/ML Engineer Cheat Sheet & Formula Guide', type: 'PDF Guide', icon: 'fa-file-pdf', bg: '#fee2e2', color: '#dc2626' },
    { name: 'Production Scikit-Learn Pipeline & ML Checklist', type: 'Markdown Guide', icon: 'fa-list-check', bg: '#dbeafe', color: '#2563eb' },
    { name: 'FastAPI Model Serving & Docker-Compose Template', type: 'ZIP Template', icon: 'fa-file-zipper', bg: '#ede9fe', color: '#7c3aed' },
    { name: 'Curated Machine Learning Datasets & Notebooks', type: 'Data Archive', icon: 'fa-database', bg: '#fef3c7', color: '#d97706' }
  ]);

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const data = await internshipApi.getResources();
        if (data && data.length > 0) {
          setResources(data);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      }
    };
    fetchRes();
  }, []);

  return (
    <div className={`rounded-3xl border p-6 transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
      <div className="cw-card-header">
        <div className="cw-card-title flex items-center gap-2 font-serif text-lg font-bold">
          <i className="fa-solid fa-cloud-arrow-down text-[var(--gold)]" />
          <span>General Downloadable Resources</span>
        </div>
        <span className="cw-badge cw-badge-green">ALL SYSTEMS ACTIVE</span>
      </div>
      <p style={{ fontSize: 13, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginBottom: 20 }}>
        Access curated codebases, starter templates, machine learning notebooks, and industry checklists to expedite your task completions.
      </p>

      <div className="space-y-3">
        {resources.map((res, idx) => (
          <div
            key={idx}
            onClick={() => alert(`Starting download for ${res.name}...`)}
            className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
              isDark
                ? 'border-white/5 hover:border-[var(--gold)]/40 bg-white/[0.02] hover:bg-white/[0.05]'
                : 'border-black/5 hover:border-[var(--gold)]/30 bg-transparent hover:bg-black/[0.02]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: res.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: res.color,
                fontSize: 16
              }}>
                <i className={`fa-solid ${res.icon}`} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, fontFamily: '"Cormorant Garamond", serif', color: isDark ? '#ffffff' : 'inherit' }}>{res.name}</div>
                <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginTop: 2 }}>{res.type} · Ready to download</div>
              </div>
            </div>
            <i className="fa-solid fa-download" style={{ color: isDark ? 'var(--gold)' : 'var(--cw-muted)', fontSize: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
