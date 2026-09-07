import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export const EvaluationReport = ({
  session,
  report,
  onStartNewInterview,
  onViewHistory,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  if (!report) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Evaluation report is not available.</p>
        <button
          onClick={onStartNewInterview}
          className="mt-4 px-6 py-2 rounded-xl bg-cyan-500 text-white font-semibold text-sm"
        >
          Start New Interview
        </button>
      </div>
    );
  }

  const overallScore = report.overall_score || 0;
  const recommendation = report.hire_recommendation || "Pending";
  const rubrics = report.rubric_scores || {};
  const strengths = report.strengths || [];
  const growthAreas = report.areas_for_growth || [];
  const questions = report.per_question_breakdown || [];

  const getRecColor = (rec) => {
    if (rec.includes("Strong Hire")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (rec.includes("Hire")) return "text-teal-400 bg-teal-500/10 border-teal-500/30";
    if (rec.includes("Lean Hire")) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    if (rec.includes("Lean No")) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
    if (score >= 65) return "text-cyan-500 dark:text-cyan-400";
    if (score >= 50) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  };

  const formatRubricName = (key) => {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fade-in">
      {/* TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Session Debrief
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(session?.created_at || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Interview Performance Report
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {session?.seniority_level} {session?.role} {session?.company_name ? `• ${session.company_name}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            onClick={onStartNewInterview}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Practice Another</span>
          </button>
        </div>
      </div>

      {/* HERO STATS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCORE GAUGE */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-200 dark:text-white/5 stroke-current"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`stroke-current transition-all duration-1000 ${
                  overallScore >= 75 ? "text-emerald-400" : overallScore >= 50 ? "text-amber-400" : "text-rose-400"
                }`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                / 100
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Hiring Assessment
          </span>
          <div
            className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getRecColor(
              recommendation
            )}`}
          >
            {recommendation}
          </div>
        </div>

        {/* EXECUTIVE SUMMARY */}
        <div className="lg:col-span-2 p-6 rounded-3xl border bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Executive Evaluation
              </h3>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200">
              {report.executive_summary}
            </p>
          </div>

          {/* QUICK STATS PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-4 border-t border-slate-200 dark:border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Role Level</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {session?.seniority_level || "Mid"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {session?.total_questions || 5} Total
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Domain</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {session?.interview_type || "Technical"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">AI Voice</span>
              <span className="text-xs font-bold text-cyan-400">
                Nova-2 / Orion
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RUBRIC SCORES */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Skill Dimension Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">Benchmark: 80+ for Senior</span>
        </div>

        <div className="space-y-4 pt-2">
          {Object.entries(rubrics).map(([key, score]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  {formatRubricName(key)}
                </span>
                <span className={getScoreColor(score)}>{score}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    score >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : score >= 60
                      ? "bg-gradient-to-r from-cyan-500 to-sky-400"
                      : "bg-gradient-to-r from-amber-500 to-rose-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRENGTHS AND GROWTH AREAS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STRENGTHS */}
        <div className="p-6 rounded-3xl border bg-emerald-500/[0.03] border-emerald-500/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
            <CheckCircleIcon className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Core Strengths Demonstrated
            </h3>
          </div>
          <ul className="space-y-3">
            {strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* GROWTH AREAS */}
        <div className="p-6 rounded-3xl border bg-amber-500/[0.03] border-amber-500/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              High-Impact Growth Opportunities
            </h3>
          </div>
          <ul className="space-y-3">
            {growthAreas.map((growth, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <span>{growth}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* QUESTION BY QUESTION ACCORDION (If present) */}
      {questions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl border bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrophyIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Question-by-Question Deep Dive
            </h3>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestion === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs">
                        Q{q.question_number || idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {q.question_text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold ${getScoreColor(q.score)}`}>
                        {q.score}/100
                      </span>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-3 border-t border-slate-200/50 dark:border-white/5 text-xs leading-relaxed">
                      {q.candidate_answer_summary && (
                        <div className="mt-3">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Candidate Response:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-black/30 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
                            {q.candidate_answer_summary}
                          </p>
                        </div>
                      )}

                      {q.feedback && (
                        <div>
                          <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Interviewer Feedback:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">
                            {q.feedback}
                          </p>
                        </div>
                      )}

                      {q.ideal_talking_points && q.ideal_talking_points.length > 0 && (
                        <div>
                          <span className="font-bold text-cyan-500 dark:text-cyan-400 block mb-1">
                            Ideal Talking Points for Senior Level:
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                            {q.ideal_talking_points.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onViewHistory}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          ← View Past Interview History
        </button>

        <button
          type="button"
          onClick={onStartNewInterview}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          Start New Practice Session
        </button>
      </div>
    </div>
  );
};

export default EvaluationReport;
