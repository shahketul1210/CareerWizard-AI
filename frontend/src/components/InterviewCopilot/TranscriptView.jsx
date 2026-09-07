import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  SpeakerWaveIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export const TranscriptView = ({
  messages = [],
  activeInterviewerMessageId = null,
  onReplayAudio = null,
  isInterviewerSpeaking = false,
}) => {
  const scrollEndRef = useRef(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isInterviewerSpeaking]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
      {messages.length === 0 ? (
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <SparklesIcon className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Setting up your live session...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Orion is reviewing your profile and preparing the opening question.
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isInterviewer = msg.role === "interviewer";
          const isCurrentSpeaking = isInterviewer && isInterviewerSpeaking && index === messages.length - 1;

          return (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 sm:gap-4 ${isInterviewer ? "justify-start" : "justify-end"}`}
            >
              {/* Interviewer Avatar */}
              {isInterviewer && (
                <div className="relative shrink-0 mt-1">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                      isCurrentSpeaking
                        ? "bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.6)] ring-2 ring-cyan-400"
                        : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-cyan-300 border border-slate-300 dark:border-white/10"
                    }`}
                  >
                    AI
                  </div>
                  {isCurrentSpeaking && (
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div
                className={`max-w-2xl flex flex-col space-y-2 ${
                  isInterviewer ? "items-start" : "items-end"
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{isInterviewer ? "Interviewer • Orion" : "You (Candidate)"}</span>
                  {msg.question_index && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/5 text-[10px]">
                      Q{msg.question_index}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed transition-all shadow-sm ${
                    isInterviewer
                      ? "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)]"
                      : "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Audio Replay for Interviewer */}
                  {isInterviewer && onReplayAudio && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onReplayAudio(msg)}
                        className="text-[11px] font-medium text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <SpeakerWaveIcon className="w-3.5 h-3.5" />
                        <span>Replay Voice</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate Avatar */}
              {!isInterviewer && (
                <div className="shrink-0 mt-1">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    You
                  </div>
                </div>
              )}
            </motion.div>
          );
        })
      )}
      <div ref={scrollEndRef} />
    </div>
  );
};

export default TranscriptView;
