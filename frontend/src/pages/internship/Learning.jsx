import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

export default function InternshipLearning() {
  const { isDark } = useContext(ThemeContext);
  const [selectedDay, setSelectedDay] = useState(6);
  const [learnings, setLearnings] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all 15 days
  useEffect(() => {
    const fetchDays = async () => {
      try {
        setLoading(true);
        const data = await internshipApi.getLearningDays();
        setLearnings(data || []);
      } catch (err) {
        console.error('Failed to load learning days:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDays();
  }, []);

  // Fetch active day detail & saved notes from DB
  useEffect(() => {
    const fetchDayDetail = async () => {
      try {
        const detail = await internshipApi.getLearningDayDetail(selectedDay);
        setActiveLesson(detail);
        setNotes(detail.saved_notes || '');
      } catch (err) {
        console.error(`Failed to load day ${selectedDay} detail:`, err);
      }
    };
    if (selectedDay) {
      fetchDayDetail();
    }
  }, [selectedDay]);

  const handleSaveNotes = async () => {
    try {
      setSavingNote(true);
      await internshipApi.saveStudyNotes(selectedDay, notes);
      alert('Notes saved successfully to database for Day ' + selectedDay + '!');
    } catch (err) {
      alert('Failed to save study notes. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const currentItem = activeLesson || learnings.find(l => l.day === selectedDay) || {
    day: selectedDay,
    title: `Day ${selectedDay} — AI / ML Lesson`,
    content: 'Interactive machine learning curriculum modules.',
    topics: ['Python', 'AI', 'ML']
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LESSONS LIST COLUMN */}
      <div className="lg:col-span-5 space-y-4">
        <div className={`rounded-3xl p-6 transition border ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
          <div className={`cw-card-title ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ marginBottom: 16, fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontSize: 20 }}>
            <i className={`fa-solid fa-graduation-cap ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
            <span>Select Learning Day (15 Days)</span>
          </div>
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {learnings.map(l => (
              <div
                key={l.day}
                onClick={() => setSelectedDay(l.day)}
                className={`p-3 rounded-xl border cursor-pointer transition ${selectedDay === l.day ? (isDark ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm' : 'border-[#16a34a] bg-[rgba(22,163,74,0.05)]') : (isDark ? 'border-white/5 bg-transparent hover:border-[var(--gold)]/30 hover:bg-white/[0.02] text-slate-300' : 'border-black/5 bg-transparent hover:border-[var(--gold)]/30 hover:bg-black/[0.02]')}`}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#ffffff' : 'inherit' }}>Day {l.day} — {l.title}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {(l.topics || []).map(t => (
                    <span key={t} className="cw-tag" style={isDark ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: 9, padding: '2px 6px' } : { fontSize: 9, padding: '2px 6px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT & NOTES COLUMN */}
      <div className="lg:col-span-7 space-y-6">
        <div className={`rounded-3xl p-6 transition border ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
          <div className="cw-card-header">
            <div className={`cw-card-title ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontSize: 20 }}>
              <i className={`fa-solid fa-book-open-reader ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
              <span>Day {currentItem.day} Lesson Content</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border font-mono ${isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'cw-badge cw-badge-purple'}`}>ACTIVE LESSON</span>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: '"EB Garamond", "Cormorant Garamond", serif', color: isDark ? '#ffffff' : 'inherit' }}>{currentItem.title}</div>
          <p style={{ fontSize: 14, color: isDark ? '#cbd5e1' : 'var(--cw-text2)', lineHeight: 1.6, marginTop: 12 }}>
            {currentItem.content || currentItem.description}
          </p>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--cw-border)' }}>
            <div className={`cw-card-title ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: 15, marginBottom: 8, fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>
              <i className={`fa-solid fa-note-sticky ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
              <span>Personal Study Notes</span>
            </div>
            <p style={{ fontSize: 12, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginBottom: 12 }}>
              Draft summary notes, code snippets, or key definitions to reference later in interview preparation modules.
            </p>
            <textarea
              className="textarea-input"
              placeholder="Paste custom codes, commands, or concepts here..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              style={isDark ? { background: '#141414', borderColor: 'rgba(255,255,255,0.12)', color: '#ffffff', width: '100%', padding: '12px', borderRadius: '10px' } : { width: '100%', padding: '12px' }}
            />
            <button
              className="cw-btn cw-btn-primary cw-btn-sm"
              style={{ marginTop: 12 }}
              disabled={savingNote}
              onClick={handleSaveNotes}
            >
              {savingNote ? 'Saving...' : 'Save Study Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
