import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export const PastSessionsModal = ({
  isOpen,
  onClose,
  sessions = [],
  isLoading = false,
  onSelectSession,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* MODAL DIALOG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl p-6 overflow-hidden z-10 space-y-6"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Past Interview Sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review past transcripts, scores, and evaluation insights
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* SESSIONS LIST */}
          <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading session history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <SparklesIcon className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No previous sessions found
                </p>
                <p className="text-xs text-slate-400">
                  Start your first live interview to build your performance history!
                </p>
              </div>
            ) : (
              sessions.map((sess) => {
                const isCompleted = sess.status === "completed";
                const dateStr = new Date(sess.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess.id);
                      onClose();
                    }}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-400 transition">
                          {sess.seniority_level} {sess.role}
                        </span>
                        {sess.company_name && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                            {sess.company_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{sess.interview_type}</span>
                        <span>•</span>
                        <span>{sess.total_questions} Questions</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCompleted && sess.overall_score !== null ? (
                        <div className="text-right">
                          <span className="block text-xs font-black text-cyan-400">
                            {sess.overall_score}/100
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold">
                            Evaluated
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                          In Progress
                        </span>
                      )}

                      <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PastSessionsModal;
