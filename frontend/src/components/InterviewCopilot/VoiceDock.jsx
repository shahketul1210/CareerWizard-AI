import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MicrophoneIcon,
  StopIcon,
  PaperAirplaneIcon,
  ChatBubbleBottomCenterTextIcon,
  HandRaisedIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import VoiceWaveform from "./VoiceWaveform";

export const VoiceDock = ({
  isRecording,
  audioLevel,
  recordingDuration,
  isInterviewerSpeaking,
  interviewerLevel,
  isSubmitting,
  onStartRecording,
  onStopAndSubmitRecording,
  onCancelRecording,
  onInterruptInterviewer,
  onSubmitTextAnswer,
  onEndInterviewEarly,
  currentQuestionIndex,
  totalQuestions,
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textAnswer.trim() || isSubmitting) return;
    onSubmitTextAnswer(textAnswer.trim());
    setTextAnswer("");
    setShowTextInput(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2">
      {/* TEXT FALLBACK DRAWER */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="mb-4 p-4 rounded-2xl border backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-cyan-400" />
                Text Response Mode
              </span>
              <button
                type="button"
                onClick={() => setShowTextInput(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your structured answer here (press Send or Ctrl+Enter)..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleTextSubmit(e);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 dark:text-white resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!textAnswer.trim() || isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Answer</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN DOCK BAR */}
      <div className="relative rounded-3xl border backdrop-blur-2xl bg-white/80 dark:bg-black/60 border-slate-200/80 dark:border-white/10 p-3 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* LEFT: STATE STATUS BADGE & PROGRESS */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {isSubmitting ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                ) : isInterviewerSpeaking ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                ) : isRecording ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                ) : (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isSubmitting
                      ? "bg-amber-400"
                      : isInterviewerSpeaking
                      ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      : isRecording
                      ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                      : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  }`}
                />
              </span>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {isSubmitting
                    ? "Evaluating Answer..."
                    : isInterviewerSpeaking
                    ? "Orion is Speaking"
                    : isRecording
                    ? `Recording (${formatDuration(recordingDuration)})`
                    : "Your Turn to Speak"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Question {currentQuestionIndex} of {totalQuestions}
                </span>
              </div>
            </div>

            {/* BARGE-IN INTERRUPT BUTTON (When AI is speaking) */}
            {isInterviewerSpeaking && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={onInterruptInterviewer}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Interrupt interviewer and speak"
              >
                <HandRaisedIcon className="w-3.5 h-3.5" />
                <span>Barge In</span>
              </motion.button>
            )}
          </div>

          {/* CENTER: INTEGRATED AUDIO WAVEFORM */}
          <div className="flex-1 max-w-xs w-full flex items-center justify-center">
            {isInterviewerSpeaking ? (
              <VoiceWaveform
                isActive={true}
                level={interviewerLevel}
                mode="interviewer"
                barCount={24}
              />
            ) : isRecording ? (
              <VoiceWaveform
                isActive={true}
                level={audioLevel}
                mode="candidate"
                barCount={24}
              />
            ) : (
              <VoiceWaveform
                isActive={false}
                level={0}
                mode="candidate"
                barCount={24}
              />
            )}
          </div>

          {/* RIGHT: CONTROLS (MIC, SEND, TEXT TOGGLE, END) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* RECORD / SEND BUTTON */}
            {!isRecording ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onStartRecording}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <MicrophoneIcon className="w-4 h-4" />
                <span>Push to Speak</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancelRecording}
                  className="p-2.5 rounded-2xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                  title="Discard recording"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onStopAndSubmitRecording}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <StopIcon className="w-4 h-4" />
                  <span>Finish & Submit</span>
                </button>
              </div>
            )}

            {/* TEXT FALLBACK TOGGLE */}
            <button
              type="button"
              onClick={() => setShowTextInput(!showTextInput)}
              className={`p-2.5 rounded-2xl border transition ${
                showTextInput
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
              title="Type response instead"
            >
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            </button>

            {/* END SESSION EARLY */}
            <button
              type="button"
              onClick={onEndInterviewEarly}
              disabled={isSubmitting}
              className="px-3 py-2.5 rounded-2xl text-[11px] font-medium text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/5 transition cursor-pointer"
              title="End interview now and view evaluation report"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceDock;
