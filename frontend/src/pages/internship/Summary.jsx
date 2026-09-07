import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

export default function InternshipSummary() {
  const { isDark } = useContext(ThemeContext);
  const [events, setEvents] = useState([]);
  const [completedCount, setCompletedCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await internshipApi.getSummary();
        setEvents(data.events || []);
        setCompletedCount(data.completed_count || 0);
      } catch (err) {
        console.error('Failed to load progress summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border p-6 transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
        <div className="cw-card-header">
          <div className="cw-card-title flex items-center gap-2 font-serif text-lg font-bold">
            <i className="fa-solid fa-clock-rotate-left text-[var(--gold)]" />
            <span>Progress Timeline & History</span>
          </div>
          <span className="cw-badge cw-badge-green">{completedCount} MILESTONES COMPLETED</span>
        </div>

        <div className="space-y-6" style={{ position: 'relative', paddingLeft: 16 }}>
          {/* Vertical Timeline Bar */}
          <div style={{ position: 'absolute', top: 8, bottom: 8, left: 6, width: 2, background: isDark ? 'rgba(255,255,255,0.1)' : 'var(--cw-border)' }} />

          {events.map(ev => (
            <div key={ev.day} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                position: 'absolute',
                left: -14,
                top: 4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#16a34a',
                border: isDark ? '2px solid #111111' : '2px solid var(--cw-white)'
              }} />
              <div className="flex-1 pb-6 pt-1">
                <div className="flex justify-between items-start">
                  <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#ffffff' : 'var(--cw-text)' }}>Day {ev.day} — {ev.title}</div>
                  <span className="cw-badge cw-badge-green">Score: {ev.score}/100</span>
                </div>
                <p style={{ fontSize: 13, color: isDark ? '#94a3b8' : 'var(--cw-text2)', marginTop: 4, lineHeight: 1.5 }}>
                  Verified successfully via automated AI code evaluation and rubric checks. Excellent engineering standards!
                </p>
              </div>
            </div>
          ))}

          {events.length === 0 && !loading && (
            <div className={`py-6 text-sm ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
              No milestones recorded yet. Submit your day tasks to build your verified milestone timeline!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
