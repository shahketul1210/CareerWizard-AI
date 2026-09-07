import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

export default function InternshipDashboard() {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext);
  const [activeLevel, setActiveLevel] = useState('intermediate');
  const [gitLink, setGitLink] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(6);
  const [scoreCount, setScoreCount] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async (dayToFetch = null) => {
    try {
      const res = await internshipApi.getOverview(dayToFetch);
      setData(res);
      if (res.selected_day) {
        setSelectedDay(res.selected_day);
      }
      if (res.difficulty_level) {
        setActiveLevel(res.difficulty_level);
      }
      setIsSubmitted(res.active_task?.is_submitted || false);
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    const target = data?.avg_score ? Number(data.avg_score) : 89;
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setScoreCount(target);
        clearInterval(timer);
      } else {
        setScoreCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [data?.avg_score]);

  const handleSelectDay = (d) => {
    setSelectedDay(d);
    fetchOverview(d);
  };

  const handleGitSubmit = async (e) => {
    e.preventDefault();
    if (!gitLink) {
      alert('Please paste your GitHub repository URL first!');
      return;
    }
    if (!gitLink.startsWith('https://github.com/') && !gitLink.startsWith('http://github.com/')) {
      alert('Please enter a valid GitHub repository URL!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await internshipApi.submitTask({
        dayNumber: selectedDay,
        githubUrl: gitLink,
        difficultyChosen: activeLevel,
        taskId: data?.active_task?.id
      });
      setIsSubmitted(true);
      setGitLink('');
      // Reload fresh data from backend
      await fetchOverview(selectedDay);
      alert(`🎉 Solution submitted successfully! AI Score: ${res.total_score}/100. Status: ${res.passed ? 'PASSED' : 'PENDING'}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Requirements for active level
  const currentReqs = (() => {
    if (!data?.active_task) return [];
    if (activeLevel === 'beginner') return data.active_task.beginner_reqs || [];
    if (activeLevel === 'advanced') return data.active_task.advanced_reqs || [];
    return data.active_task.inter_reqs || [];
  })();

  const phaseName = (() => {
    const p = data?.active_task?.phase || 1;
    if (p === 1) return 'Phase 1: Foundation';
    if (p === 2) return 'Phase 2: Build';
    return 'Phase 3: Deploy & Capstone';
  })();

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* TOP BANNER / PROGRESS SECTION */}
      <div className={`rounded-2xl relative overflow-hidden transition-all duration-300 border ${isDark ? 'bg-[#0a0a0a] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_8px_30px_rgba(160,120,64,0.06)]'}`}>
        {/* Pills strip — subtle bg + bottom border */}
        <div className="flex flex-wrap items-center gap-2 px-5 sm:px-7 pt-5 pb-0">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono flex items-center gap-1.5 border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
            <i className="fa-solid fa-microchip text-[10px]" /> {data?.track_name || 'AI / ML Internship'}
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
            ★ {data?.rank_percentile || 'Top 2%'}
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-white text-[var(--cw-muted)] border border-[var(--cw-border)]'}`}>
            ✦ {data?.plan_name || '15-Day Internship'}
          </span>
        </div>

        {/* Main body */}
        <div className="px-5 sm:px-7 pt-4 pb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">

            {/* Left: Headline + subtitle */}
            <div className="flex-1">
              <div className={`text-[26px] sm:text-[30px] font-bold tracking-tight leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>
                Build Real Projects & Improve your skills.
              </div>
              <div className="mt-4 pl-3 border-l-[3px] border-emerald-500">
                <p className={`text-[13px] font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
                  Hands-on projects. Real-world impact.<br />Stand out with verified skills.
                </p>
              </div>
            </div>

            {/* Right: Score Card */}
            <div className={`flex-shrink-0 rounded-2xl px-8 py-5 min-w-[240px] border transition-all ${isDark ? 'bg-[#111111]/90 border-white/10 shadow-sm' : 'bg-[#fbf8f1] border-[var(--cw-border)] shadow-[0_4px_20px_rgba(160,120,64,0.06)]'}`}>
              {/* Header label */}
              <div className={`text-[9px] font-black tracking-[0.22em] uppercase font-mono mb-4 text-center ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
                Your Score
              </div>
              {/* Ring + divider + rank */}
              <div className="flex items-center justify-center gap-6">
                {/* Ring */}
                <div className="relative w-[76px] h-[76px] flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-[var(--gold)] opacity-20" strokeWidth="9" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke="var(--gold)" strokeWidth="9" fill="transparent"
                      strokeDasharray="251.3" strokeDashoffset={251.3 - (251.3 * scoreCount) / 100} strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pt-0.5 pl-1.5">
                    <span className={`text-[32px] leading-none italic ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>
                      {scoreCount}<span className={`text-[14px] ml-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>%</span>
                    </span>
                  </div>
                </div>

                {/* Vertical divider */}
                <div className={`w-px h-12 ${isDark ? 'bg-white/10' : 'bg-[var(--cw-border)]'}`} />

                {/* Rank */}
                <div className="flex flex-col items-start gap-0.5">
                  <div className={`text-[9px] font-black tracking-[0.18em] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Rank</div>
                  <div className={`text-[28px] leading-tight tracking-tight italic ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>{data?.rank || '#312'}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    ↑ {data?.rank_percentile || 'Top 2%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar section */}
        <div className={`px-5 sm:px-7 pb-6 border-t ${isDark ? 'border-white/10' : 'border-[var(--cw-border)]'}`}>
          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2.5">
              <span className={`text-[10px] font-bold uppercase tracking-[0.13em] font-mono ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Overall progress</span>
              <span className="text-[10px] font-black text-emerald-500 font-mono tracking-wide num-font">
                {data ? `${data.tasks_completed_count} / ${data.total_days} days — ${data.progress_percent}%` : '5 / 15 days — 33%'}
              </span>
            </div>
            <div className={`w-full h-[6px] rounded-full overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-[var(--cw-bg2)] border-[var(--cw-border)]'}`}>
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${data?.progress_percent || 33}%` }}
              />
            </div>

            {/* Timeline Nodes (15 Days) */}
            <div className="flex items-center gap-[6px] mt-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
              {(data?.timeline || Array.from({ length: 15 }, (_, i) => ({ day: i + 1, status: i + 1 < 6 ? 'done' : (i + 1 === 6 ? 'active' : 'locked') }))).map((node) => {
                const isSelected = selectedDay === node.day;
                const isDone = node.status === 'done';
                const isActive = node.status === 'active';
                const isAvailable = node.status === 'available';

                if (isSelected) {
                  return (
                    <div
                      key={node.day}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-600 border-2 border-emerald-400 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer num-font shadow-md shadow-emerald-600/30 ring-2 ring-offset-1 ring-emerald-400/40"
                    >
                      {node.day}
                    </div>
                  );
                }

                if (isDone) {
                  return (
                    <div
                      key={node.day}
                      onClick={() => handleSelectDay(node.day)}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors num-font ${isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'}`}
                    >
                      {node.day}
                    </div>
                  );
                }

                if (isAvailable || isActive) {
                  return (
                    <div
                      key={node.day}
                      onClick={() => handleSelectDay(node.day)}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors num-font ${isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                    >
                      {node.day}
                    </div>
                  );
                }

                return (
                  <div
                    key={node.day}
                    onClick={() => handleSelectDay(node.day)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-[11px] font-medium opacity-60 hover:opacity-100 cursor-pointer num-font transition-opacity ${isDark ? 'bg-white/[0.03] border-white/10 text-slate-500' : 'bg-[var(--cw-bg2)] border-[var(--cw-border)] text-[var(--cw-muted)]'}`}
                  >
                    {node.day}
                  </div>
                );
              })}
            </div>

            {/* Phase labels */}
            <div className="flex justify-between items-center mt-2.5 text-[9px] font-mono tracking-widest font-bold uppercase">
              <span className={selectedDay <= 5 ? (isDark ? 'text-emerald-400 font-black' : 'text-emerald-700 font-black') : (isDark ? 'text-slate-500' : 'text-[var(--cw-muted)]')}>Phase 1: Foundation (Days 1–5)</span>
              <span className={selectedDay >= 6 && selectedDay <= 11 ? (isDark ? 'text-blue-400 flex items-center gap-1 font-black' : 'text-blue-600 flex items-center gap-1 font-black') : (isDark ? 'text-slate-500' : 'text-[var(--cw-muted)]')}>
                Phase 2: Build & Advanced ML (Days 6–11) {selectedDay >= 6 && selectedDay <= 11 && <i className="fa-solid fa-caret-left text-[9px]" />}
              </span>
              <span className={selectedDay >= 12 ? (isDark ? 'text-purple-400 font-black' : 'text-purple-600 font-black') : (isDark ? 'text-slate-500' : 'text-[var(--cw-muted)]')}>Phase 3: Deploy & Capstone (Days 12–15)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STATS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 sm:p-5 rounded-2xl border transition flex items-center gap-3.5 ${isDark ? 'bg-[#111111]/80 border-white/5 hover:border-[var(--gold)]/30 hover:bg-[#1a1a1a] shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.05)] hover:shadow-[0_4px_20px_rgba(160,120,64,0.08)]'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-[var(--gold)]' : 'bg-[#f2eee1] border-[var(--cw-border)] text-[var(--cw-text)]'}`}>
            <i className="fa-solid fa-clipboard-check" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold leading-tight num-font tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data ? data.tasks_completed_count : 5}
            </div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Tasks done</div>
            <div className={`text-[11px] font-bold mt-1 flex items-center gap-0.5 num-font ${isDark ? 'text-[var(--gold)]' : 'text-[var(--gold)] opacity-90'}`}>↑ {data?.streak_days ? 'Active streak' : '1 today'}</div>
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition flex items-center gap-3.5 ${isDark ? 'bg-[#111111]/80 border-white/5 hover:border-[var(--gold)]/30 hover:bg-[#1a1a1a] shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.05)] hover:shadow-[0_4px_20px_rgba(160,120,64,0.08)]'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-[var(--gold)]' : 'bg-[#f2eee1] border-[var(--cw-border)] text-[var(--cw-text)]'}`}>
            <i className="fa-solid fa-fire" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold leading-tight num-font tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data ? data.streak_days : 6}
            </div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Day streak</div>
            <div className={`text-[11px] font-bold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Keep it up!</div>
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition flex items-center gap-3.5 ${isDark ? 'bg-[#111111]/80 border-white/5 hover:border-[var(--gold)]/30 hover:bg-[#1a1a1a] shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.05)] hover:shadow-[0_4px_20px_rgba(160,120,64,0.08)]'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-[var(--gold)]' : 'bg-[#f2eee1] border-[var(--cw-border)] text-[var(--cw-text)]'}`}>
            <i className="fa-solid fa-calendar-day" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold leading-tight num-font tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data ? data.days_remaining : 9}
            </div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Days remaining</div>
            <div className={`text-[11px] font-bold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>On schedule</div>
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition flex items-center gap-3.5 ${isDark ? 'bg-[#111111]/80 border-white/5 hover:border-[var(--gold)]/30 hover:bg-[#1a1a1a] shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.05)] hover:shadow-[0_4px_20px_rgba(160,120,64,0.08)]'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-[var(--gold)]' : 'bg-[#f2eee1] border-[var(--cw-border)] text-[var(--cw-text)]'}`}>
            <i className="fa-solid fa-trophy" />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold leading-tight num-font tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>60%</div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>Pass threshold</div>
            <div className={`text-[11px] font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>You're at {data ? data.avg_score : 89} ✓</div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION — TODAY'S TASK & RESOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ACTIVE TASK (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`border rounded-2xl p-5 sm:p-6 transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_8px_30px_rgba(160,120,64,0.06)]'}`}>
            <div className="flex justify-between items-center mb-3.5">
              <div className={`text-[15px] font-extrabold flex items-center gap-2 uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontWeight: 800 }}>
                <i className={`fa-solid fa-clipboard-list text-base ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} />
                <span>Task — Day {selectedDay}</span>
              </div>
              <button onClick={() => navigate('/internship/projects')} className={`px-3 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-[var(--cw-border)] hover:bg-[var(--cw-bg2)] text-[var(--cw-text)]'}`}>
                + Add Own Project
              </button>
            </div>

            <div className="mb-3.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border font-mono tracking-wide ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                {data?.active_task?.phase_label || 'Phase 2 · Due 11:59 PM'}
              </span>
            </div>

            <div className={`text-[22px] sm:text-[26px] font-bold tracking-tight leading-snug mb-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>
              {data?.active_task?.title || 'Tree-Based Models & Ensemble Learning (Random Forest & XGBoost)'}
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-[var(--cw-text2)]'}`}>
              {data?.active_task?.description || 'Transition from linear paradigms to non-linear decision trees and ensemble methods. Understand Bagging, Boosting, Gini Impurity, and train state-of-the-art Random Forest and XGBoost classifiers.'}
            </p>

            {/* LEVEL SELECTOR TABS */}
            <div className={`flex items-center gap-2 mb-5 p-1 rounded-xl w-fit border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-[var(--cw-bg2)] border-[var(--cw-border)]'}`}>
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1.5 ${activeLevel === lvl
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-extrabold'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[var(--cw-muted)] hover:text-[var(--cw-text)]'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${lvl === 'beginner' ? 'bg-emerald-400' : lvl === 'intermediate' ? 'bg-emerald-600' : 'bg-red-500'}`} />
                  {lvl}
                </button>
              ))}
            </div>

            {/* REQUIREMENTS BOX */}
            <div className={`rounded-r-xl p-4 border-l-[3px] mb-4 border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-[#f2eee1] border-[var(--cw-border)]'} ${activeLevel === 'beginner' ? 'border-l-emerald-500' : activeLevel === 'intermediate' ? 'border-l-amber-500' : 'border-l-red-600'}`}>
              <div className={`text-[16px] font-extrabold flex items-center gap-2.5 mb-3.5 tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontWeight: 800 }}>
                <div className="relative flex items-center justify-center">
                  <span className={`w-3.5 h-3.5 rounded-full ${activeLevel === 'beginner' ? 'bg-emerald-500' : activeLevel === 'intermediate' ? 'bg-amber-500' : 'bg-red-500'} shadow-sm`} />
                  <span className={`absolute w-3.5 h-3.5 rounded-full ${activeLevel === 'beginner' ? 'bg-emerald-500' : activeLevel === 'intermediate' ? 'bg-amber-500' : 'bg-red-500'} animate-ping opacity-30`} />
                </div>
                {activeLevel.charAt(0).toUpperCase() + activeLevel.slice(1)} requirements
              </div>
              <div className="space-y-3">
                {currentReqs.map((req, idx) => (
                  <div key={idx} className={`text-[13px] font-medium flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-[var(--cw-text2)]'}`}>
                    <span className={`mt-0.5 text-sm ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`}>→</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TECH STACK PILLS */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(data?.active_task?.tech_tags || ['Python', 'Scikit-Learn', 'Random Forest', 'XGBoost', 'LightGBM']).map((tech) => (
                <span key={tech} className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-[var(--cw-bg2)] text-[var(--cw-text)] border-[var(--cw-border)]'}`}>
                  {tech}
                </span>
              ))}
            </div>

            {/* GITHUB SUBMISSION BOX */}
            <div className={`border rounded-2xl p-4 sm:p-5 mb-6 shadow-sm ${isDark ? 'bg-[#0e0e0e] border-white/10' : 'bg-[#fbf8f1] border-[var(--cw-border)]'}`}>
              <div className={`text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
                <i className={`fa-brands fa-github text-sm ${isDark ? 'text-white' : 'text-[var(--cw-text)]'}`} /> SUBMIT GITHUB REPOSITORY LINK
              </div>
              {isSubmitted ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-check text-xl text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">Repository Submitted Successfully!</div>
                      <div className="text-[11px] opacity-80 mt-0.5 text-emerald-400">AI code assessment verified and saved in database.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-3 py-1 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 transition"
                  >
                    Resubmit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGitSubmit} className={`flex flex-col sm:flex-row gap-2 p-1 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-transparent border-[var(--gold)]/20 shadow-[0_2px_10px_rgba(160,120,64,0.04)]'}`}>
                  <input
                    type="url"
                    className={`flex-1 px-3 py-1.5 bg-transparent text-xs focus:outline-none font-mono ${isDark ? 'text-white placeholder:text-slate-500' : 'text-[var(--cw-text)]'}`}
                    placeholder="https://github.com/username/ai-ml-project"
                    value={gitLink}
                    onChange={(e) => setGitLink(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm shadow-emerald-600/20 flex-shrink-0 disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Submit →'}
                  </button>
                </form>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className={`flex flex-wrap items-center gap-2.5 pt-2 border-t ${isDark ? 'border-white/10' : 'border-[var(--cw-border)]'}`}>
              <button className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-[var(--cw-border)] hover:bg-[var(--cw-bg2)] text-[var(--cw-text)]'}`} onClick={() => alert('AI Assistant Ready: Ask any question about Machine Learning pipelines, models, or feature engineering.')}>
                <i className="fa-solid fa-robot text-purple-400 text-sm" /> Ask AI
              </button>
              <button className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-[var(--cw-border)] hover:bg-[var(--cw-bg2)] text-[var(--cw-text)]'}`} onClick={() => alert('Full AI/ML Grading Rubric:\n- Correctness & Logic (25%)\n- Code Structure & Modularity (25%)\n- Model Performance & Evaluation (25%)\n- Documentation & Reproducibility (25%)')}>
                <i className="fa-solid fa-chart-column text-emerald-400 text-sm" /> Rubric
              </button>
              <button className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-[var(--cw-border)] hover:bg-[var(--cw-bg2)] text-[var(--cw-text)]'}`} onClick={() => navigate('/internship/learning')}>
                <i className="fa-solid fa-book-open-reader text-blue-400 text-sm" /> Learn
              </button>
              <button className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-[var(--cw-border)] hover:bg-[var(--cw-bg2)] text-[var(--cw-text)]'}`} onClick={() => navigate('/internship/tasks')}>
                <i className="fa-solid fa-list-check text-amber-400 text-sm" /> All Tasks
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCES & CERTIFICATE (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* RESOURCES BOX */}
          <div className={`border p-5 sm:p-6 rounded-2xl transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_8px_30px_rgba(160,120,64,0.06)]'}`}>
            <div className={`text-xl font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>
              <i className={`fa-solid fa-book-open ${isDark ? 'text-[var(--gold)]' : 'text-[var(--cw-muted)]'}`} /> Resources for today
            </div>
            <div className="space-y-2.5">
              {(data?.resources || []).map((res, idx) => (
                <a key={idx} href={res.link} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-3.5 rounded-xl border transition group shadow-xs ${isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-[var(--cw-border)] bg-[#f2eee1] hover:bg-[#eae4d3]'}`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${res.bg}`}>
                      <i className={res.icon} />
                    </div>
                    <div>
                      <div className={`text-xs font-bold transition font-sans ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'}`}>{res.title}</div>
                      <div className={`text-[11px] mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>{res.subtitle}</div>
                    </div>
                  </div>
                  {res.title !== 'Download All Resources' && (
                    <i className={`fa-solid fa-arrow-up-right-from-square text-xs ml-2 flex-shrink-0 transition ${isDark ? 'text-slate-500 group-hover:text-white' : 'text-[var(--cw-muted)] group-hover:text-[var(--cw-text)]'}`} />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* CERTIFICATE PROGRESS BOX */}
          <div className={`rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden border ${isDark ? 'bg-emerald-950/20 border-emerald-500/25' : 'bg-emerald-50/80 border-emerald-200/80'}`}>
            <div className={`text-[15px] font-extrabold flex items-center gap-2 mb-2 uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif', fontWeight: 800 }}>
              <i className="fa-solid fa-award text-base text-emerald-500" /> Certificate progress
            </div>
            <p className={`text-xs leading-relaxed mb-5 font-medium ${isDark ? 'text-slate-300' : 'text-emerald-900/80'}`}>
              Complete all tasks with 60%+ average to earn your blockchain-verified certificate.
            </p>
            <div className="space-y-3 mb-6 text-xs font-semibold">
              <div className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-white/10' : 'border-emerald-200/50'}`}>
                <span className={isDark ? 'text-slate-300' : 'text-emerald-900/70'}>Tasks completed</span>
                <span className={`font-bold font-mono num-font ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  {data?.tasks_completed_count || 5} / {data?.total_days || 15}
                </span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-white/10' : 'border-emerald-200/50'}`}>
                <span className={isDark ? 'text-slate-300' : 'text-emerald-900/70'}>Average score</span>
                <span className={`font-bold font-mono num-font ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  {data?.avg_score || 89} / 100
                </span>
              </div>
              <div className="flex justify-between items-center pb-0.5">
                <span className={isDark ? 'text-slate-300' : 'text-emerald-900/70'}>Status</span>
                <span className={`font-bold flex items-center gap-1 font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}><i className="fa-solid fa-check" /> On track</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/internship/certificates')}
              className={`w-full py-2.5 px-4 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition duration-200 ${isDark ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-600 hover:text-white' : 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
            >
              <i className="fa-solid fa-eye text-xs" /> View certificates
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION — SUBMITTED TASKS TABLE */}
      <div className="space-y-3.5 pt-2">
        <div className={`text-[26px] font-bold px-1 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: '"EB Garamond", "Cormorant Garamond", serif' }}>Submitted tasks</div>
        <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_8px_30px_rgba(160,120,64,0.06)]'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className={`border-b text-[10px] font-mono tracking-wider uppercase ${isDark ? 'border-white/5 bg-white/[0.02] text-slate-400' : 'border-[var(--cw-border)] bg-[var(--cw-bg2)]/60 text-[var(--cw-muted)]'}`}>
                  <th className="py-3 pl-5 font-bold w-14">DAY</th>
                  <th className="py-3 font-bold">TASK</th>
                  <th className="py-3 font-bold text-center w-28">PHASE</th>
                  <th className="py-3 font-bold text-center w-24">SCORE</th>
                  <th className="py-3 font-bold text-center w-24">RESULT</th>
                  <th className="py-3 font-bold text-right pr-5 w-20">REVIEW</th>
                </tr>
              </thead>
              <tbody className={`text-xs ${isDark ? 'divide-y divide-white/5' : 'divide-y divide-[var(--cw-border)]'}`}>
                {(data?.submitted_tasks || []).map((sub, idx) => (
                  <tr key={idx} className={`transition group ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[var(--cw-bg2)]/40'}`}>
                    <td className={`py-3.5 pl-5 font-bold text-base num-font ${isDark ? 'text-white' : 'text-slate-900'}`}>{sub.day}</td>
                    <td className="py-3.5">
                      <div className={`font-bold text-xs transition ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'}`}>{sub.title}</div>
                      <div className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>{sub.date}</div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${isDark ? (sub.isPurple ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20') : (sub.isPurple ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200')}`}>
                        {sub.phase}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border shadow-xs num-font ${isDark ? (sub.isAmber ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') : (sub.isAmber ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}`}>
                        {sub.score}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${isDark ? (sub.isAmber ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20') : (sub.isAmber ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200')}`}>
                        {sub.result}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-5">
                      <button
                        onClick={() => alert(`Review Feedback for Day ${sub.day}:\n\n${sub.feedback || 'High quality code meeting all technical rubric standards.'}`)}
                        className={`font-bold text-xs inline-flex items-center gap-1 transition ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 group-hover:text-blue-800'}`}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
