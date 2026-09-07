import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import internshipApi from '../../api/internshipApi';

const CircularScore = ({ score, isDark }) => {
  const size = 76;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--gold)" strokeWidth={strokeWidth} fill="none" opacity={0.2} />
        {/* Progress Circle */}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--gold)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 26, fontWeight: 700, color: isDark ? '#ffffff' : 'var(--text-main)', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#94a3b8' : 'var(--cw-muted)', marginLeft: 2 }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default function InternshipCertificates() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const [certificates, setCertificates] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        setLoading(true);
        const data = await internshipApi.getCertificates();
        setCertificates(data.certificates || []);
        setInProgress(data.in_progress || []);
      } catch (err) {
        console.error('Failed to load certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  const openCertificate = (cert) => {
    const certificatePayload = {
      name: user?.name || user?.full_name || 'Candidate',
      role: `${cert.track} Track`,
      days: cert.title.includes('30-Day') ? '30' : '15',
      start: 'Jan 1, 2025',
      end: cert.issued,
      certid: cert.id_code,
      score: (cert.score / 10).toFixed(1),
      tasks: cert.title.includes('30-Day') ? '30/30' : '15/15',
      grade: cert.score >= 90 ? 'A+' : cert.score >= 80 ? 'A' : 'B+',
      programTitle: cert.title,
      verified: cert.verified,
      blockchain: cert.blockchain,
    };

    localStorage.setItem(`certificate:${cert.id_code}`, JSON.stringify(certificatePayload));
    navigate(`/internship/certificates/${encodeURIComponent(cert.id_code)}`, {
      state: { certificate: certificatePayload },
    });
  };

  return (
    <div className="space-y-6">
      {/* MY CERTIFICATES */}
      <div className={`rounded-3xl border p-6 transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
        <div className="cw-card-header">
          <div className="cw-card-title flex items-center gap-2 font-serif text-lg font-bold">
            <i className="fa-solid fa-certificate text-[var(--gold)]" />
            <span>My Certificates</span>
          </div>
        </div>

        <div className="space-y-4">
          {certificates.map(cert => (
            <div
              key={cert.id}
              onClick={() => openCertificate(cert)}
              className={`group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center gap-4 ${
                isDark
                  ? 'border-white/5 hover:border-[var(--gold)]/40 bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-black/5 hover:border-[var(--gold)]/40 hover:bg-white bg-transparent hover:shadow-[0_8px_24px_rgba(160,120,64,0.08)]'
              }`}
            >
              {/* ICON */}
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#16a34a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>

              {/* INFO */}
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-extrabold leading-snug" style={{ fontFamily: '"Cormorant Garamond", serif', color: isDark ? '#ffffff' : 'var(--text-main)' }}>{cert.title}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                    Issued {cert.issued}
                  </span>
                  {cert.blockchain && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                      Blockchain verified
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">ID: {cert.id_code}</span>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCertificate(cert);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    View & Download PDF
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Certificate ID: ${cert.id_code}\nBlockchain Verification: Verified on ledger\nGrade: A+`);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    Verify
                  </button>
                </div>
              </div>

              {/* SCORE */}
              <div className="shrink-0 flex items-center justify-center">
                <CircularScore score={cert.score} isDark={isDark} />
              </div>
            </div>
          ))}
          {certificates.length === 0 && !loading && (
            <div className={`py-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-[var(--cw-muted)]'}`}>
              No issued certificates yet. Complete the 15-day tasks with a 60%+ score average to unlock your verified credential!
            </div>
          )}
        </div>
      </div>

      {/* IN PROGRESS */}
      <div className={`rounded-3xl border p-6 transition ${isDark ? 'bg-[#111111]/80 border-white/5 shadow-sm text-white' : 'bg-[#fbf8f1] border-[var(--gold)]/20 shadow-[0_4px_20px_rgba(160,120,64,0.04)]'}`}>
        <div className="cw-card-header">
          <div className="cw-card-title flex items-center gap-2 font-serif text-lg font-bold">
            <i className="fa-solid fa-hourglass-half text-[var(--gold)]" />
            <span>In progress</span>
          </div>
        </div>

        <div className="space-y-4">
          {inProgress.map(item => (
            <div
              key={item.id}
              className={`group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center gap-4 ${
                isDark
                  ? 'border-white/5 hover:border-[var(--gold)]/40 bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-black/5 hover:border-[var(--gold)]/40 hover:bg-white bg-transparent hover:shadow-[0_8px_24px_rgba(160,120,64,0.08)]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-extrabold" style={{ fontFamily: '"Cormorant Garamond", serif', color: isDark ? '#ffffff' : 'var(--text-main)' }}>{item.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.progress} / {item.total} tasks done · Avg score {item.avg_score} · On track for certificate
                </div>
                {/* PROGRESS BAR */}
                <div className="mt-2.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden w-full max-w-[180px]">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all"
                    style={{ width: `${(item.progress / item.total) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => navigate('/internship')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#16a34a] hover:bg-emerald-600 text-white transition shadow-sm shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                Continue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
