import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import interviewCopilotApi from "../api/interviewCopilotApi";
import { useLiveCallVoice } from "../hooks/useLiveCallVoice";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { EvaluationReport } from "./InterviewCopilot/EvaluationReport";
import { PastSessionsModal } from "./InterviewCopilot/PastSessionsModal";

export const InterviewCopilotOutlet = () => {
  const { user } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);

  // Phases: "setup" | "live" | "finished"
  const [phase, setPhase] = useState("setup");

  // Setup Form Fields matching ai-interview-copilot.html
  const [roleInput, setRoleInput] = useState("Computer Engineering internship candidate");
  const [levelInput, setLevelInput] = useState("Internship");
  const [styleInput, setStyleInput] = useState("Balanced (technical + HR)");
  const [focusInput, setFocusInput] = useState("");
  const [candidateInput, setCandidateInput] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Active Session State
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  // Past Sessions state
  const [pastSessions, setPastSessions] = useState([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [showPastModal, setShowPastModal] = useState(false);

  // Text fallback state
  const [showTextInput, setShowTextInput] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  const transcriptEndRef = useRef(null);
  const currentSessionRef = useRef(currentSession);
  const isSubmittingRef = useRef(isSubmittingAnswer);
  const phaseRef = useRef(phase);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  useEffect(() => {
    isSubmittingRef.current = isSubmittingAnswer;
  }, [isSubmittingAnswer]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Audio player hook for Orion's voice
  const {
    isPlaying: isInterviewerSpeaking,
    interviewerLevel,
    playAudio,
    stopAudio,
  } = useAudioPlayer();

  // Format current time as "3:45 PM"
  const formatTime = (dateObj) => {
    const d = dateObj ? new Date(dateObj) : new Date();
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  // 100% Automatic Speech Submission (Real Phone Call Style — No Clicks Needed!)
  const handleAutoSubmitSpeech = useCallback(
    async (speechPayload) => {
      const speechText =
        typeof speechPayload === "string" ? speechPayload : speechPayload?.text;
      const audioBlob =
        typeof speechPayload === "object" ? speechPayload?.audioBlob : null;

      if (!speechText || isSubmittingRef.current || phaseRef.current !== "live") return;
      if (!currentSessionRef.current?.id) return;

      const trimmedText = speechText.trim();
      if (!trimmedText) return;

      // OPTIMISTIC UPDATE: Add candidate message immediately so it NEVER vanishes from view
      const tempCandId = `cand-${Date.now()}`;
      const optimisticCandidateMsg = {
        id: tempCandId,
        role: "candidate",
        content: trimmedText,
        created_at: new Date().toISOString(),
        timeStr: formatTime(new Date()),
      };

      setMessages((prev) => [...prev, optimisticCandidateMsg]);

      try {
        setIsSubmittingAnswer(true);
        stopAudio();

        // Package audio file for Deepgram Nova-2 STT if available
        let file = null;
        if (audioBlob && audioBlob.size > 2000) {
          try {
            file = new File([audioBlob], "candidate_answer.webm", {
              type: audioBlob.type || "audio/webm",
            });
          } catch (e) {
            console.warn("Could not wrap audioBlob as File:", e);
          }
        }

        const response = await interviewCopilotApi.submitAnswer(currentSessionRef.current.id, {
          file,
          text: trimmedText,
        });

        const candidateFinalContent =
          (response.candidate_message?.content && response.candidate_message.content !== "[Silence or inaudible]")
            ? response.candidate_message.content
            : trimmedText;

        const backendCandMsg = {
          ...response.candidate_message,
          content: candidateFinalContent,
          timeStr: formatTime(response.candidate_message?.created_at),
        };

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === tempCandId);
          let updated = exists
            ? prev.map((m) => (m.id === tempCandId ? backendCandMsg : m))
            : [...prev, backendCandMsg];
          if (response.interviewer_message) {
            updated.push({
              ...response.interviewer_message,
              timeStr: formatTime(response.interviewer_message.created_at),
            });
          }
          return updated;
        });

        if (response.status === "completed") {
          setEvaluationReport(response.evaluation_report);
          setPhase("finished");
          if (response.audio_base64) {
            playAudio(response.audio_base64);
          }
        } else {
          if (response.audio_base64) {
            playAudio(response.audio_base64);
          }
        }
      } catch (err) {
        console.error("Auto submit speech error:", err);
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [stopAudio, playAudio]
  );

  // Live Hands-Free Phone Call Voice Hook
  const {
    isCallActive,
    isUserSpeaking,
    interimTranscript,
    audioLevel,
    startCall,
    endCall,
  } = useLiveCallVoice({
    onSpeechFinal: handleAutoSubmitSpeech,
    isAiSpeaking: isInterviewerSpeaking,
  });

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmittingAnswer, isInterviewerSpeaking, phase, isUserSpeaking, interimTranscript]);

  // START INTERVIEW (INSTANT 0MS TRANSITION ON CLICK)
  const handleStartInterview = async () => {
    try {
      setSessionError(null);
      setIsInitializing(true);
      stopAudio();

      // Switch to live interface IMMEDIATELY on click (0ms delay)
      setPhase("live");

      // Concurrent execution: activate voice engine and initialize backend session
      const callPromise = startCall();

      const candidateName = user?.name ? user.name.split(" ")[0] : "";
      const sessionPromise = interviewCopilotApi.createSession({
        role: roleInput.trim() || "Computer Engineering candidate",
        seniority_level: levelInput,
        interview_type: styleInput.includes("technical")
          ? "Technical"
          : styleInput.includes("HR")
          ? "Behavioral"
          : "Mixed",
        job_description: focusInput.trim() || undefined,
        resume_context: candidateInput.trim() || undefined,
        total_questions: totalQuestions,
      });

      const result = await sessionPromise;

      setCurrentSession(result.session);
      const initialMsg = {
        ...result.first_message,
        timeStr: formatTime(result.first_message.created_at),
      };
      setMessages([initialMsg]);

      // Ensure audio/mic capture line is ready
      await callPromise;

      // Play interviewer initial greeting
      if (result.audio_base64) {
        playAudio(result.audio_base64);
      }
    } catch (err) {
      console.error("Failed to start call:", err);
      setPhase("setup");
      setSessionError(err.response?.data?.detail || "Could not connect call. Please check microphone permissions.");
    } finally {
      setIsInitializing(false);
    }
  };

  // TEXT FALLBACK SUBMISSION (WITH OPTIMISTIC PERSISTENCE)
  const handleSubmitTextAnswer = async (e) => {
    if (e) e.preventDefault();
    const trimmed = textAnswer.trim();
    if (!trimmed || isSubmittingAnswer) return;

    const tempCandId = `cand-txt-${Date.now()}`;
    const optimisticCandidateMsg = {
      id: tempCandId,
      role: "candidate",
      content: trimmed,
      created_at: new Date().toISOString(),
      timeStr: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, optimisticCandidateMsg]);
    setTextAnswer("");
    setShowTextInput(false);

    try {
      setIsSubmittingAnswer(true);
      stopAudio();

      const response = await interviewCopilotApi.submitAnswer(currentSession.id, {
        text: trimmed,
      });

      const candidateFinalContent =
        (response.candidate_message?.content && response.candidate_message.content !== "[Silence or inaudible]")
          ? response.candidate_message.content
          : trimmed;

      const backendCandMsg = {
        ...response.candidate_message,
        content: candidateFinalContent,
        timeStr: formatTime(response.candidate_message?.created_at),
      };

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === tempCandId);
        let updated = exists
          ? prev.map((m) => (m.id === tempCandId ? backendCandMsg : m))
          : [...prev, backendCandMsg];
        if (response.interviewer_message) {
          updated.push({
            ...response.interviewer_message,
            timeStr: formatTime(response.interviewer_message.created_at),
          });
        }
        return updated;
      });

      if (response.status === "completed") {
        setEvaluationReport(response.evaluation_report);
        setPhase("finished");
        if (response.audio_base64) {
          playAudio(response.audio_base64);
        }
      } else {
        if (response.audio_base64) {
          playAudio(response.audio_base64);
        }
      }
    } catch (err) {
      console.error("Failed to submit text answer:", err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // END CALL & VIEW VERDICT
  const handleEndCall = async () => {
    const confirmEnd = window.confirm(
      "Would you like to conclude the call now and receive your interview evaluation report?"
    );
    if (!confirmEnd) return;

    try {
      setIsSubmittingAnswer(true);
      stopAudio();
      endCall();

      const updated = await interviewCopilotApi.endSessionEarly(currentSession.id);
      setCurrentSession(updated);
      setEvaluationReport(updated.evaluation_report);
      setPhase("finished");
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // REPLAY INTERVIEWER AUDIO
  const handleReplayAudio = async (msg) => {
    try {
      if (msg.audio_url) {
        playAudio(msg.audio_url);
      } else {
        const audioUrl = await interviewCopilotApi.getTtsAudio(msg.content);
        playAudio(audioUrl);
      }
    } catch (e) {
      console.warn("Could not replay audio:", e);
    }
  };

  // OPEN PAST SESSIONS MODAL
  const handleOpenPastSessions = async () => {
    setShowPastModal(true);
    try {
      setIsLoadingPast(true);
      const list = await interviewCopilotApi.listSessions(25);
      setPastSessions(list || []);
    } catch (err) {
      console.error("Failed to load past sessions:", err);
    } finally {
      setIsLoadingPast(false);
    }
  };

  // SELECT PAST SESSION FROM MODAL
  const handleSelectPastSession = async (sess) => {
    try {
      const full = await interviewCopilotApi.getSession(sess.id);
      setCurrentSession(full);
      setEvaluationReport(full.evaluation_report);
      setMessages(
        (full.messages || []).map((m) => ({
          ...m,
          timeStr: formatTime(m.created_at),
        }))
      );
      setPhase("finished");
      setShowPastModal(false);
    } catch (e) {
      console.error("Failed to load session details:", e);
    }
  };

  // RESTART NEW INTERVIEW
  const handleRestart = () => {
    stopAudio();
    endCall();
    setCurrentSession(null);
    setMessages([]);
    setEvaluationReport(null);
    setPhase("setup");
    setSessionError(null);
  };

  return (
    <div className={`interview-copilot-container ${isDark ? 'dark' : ''}`}>
      {/* EXACT CSS STYLESHEET MATCHING ai-interview-copilot.html WITH DARK MODE SUPPORT */}
      <style>{`
        :root {
          --bg: #EFE8D8;
          --paper: #FBF7EC;
          --ink: #2B2419;
          --ink-soft: #6E624C;
          --accent: #8A6A32;
          --accent-soft: #C9AE7C;
          --line: #E3D8BE;
          --interviewer-bubble: #FFFFFF;
          --student-bubble: #DCEFC7;
          --student-bubble-border: #C4E1A6;
          --tick-blue: #4FA3D1;
          --radius: 12px;
        }

        html.dark, :root.dark, body.dark, .interview-copilot-container.dark {
          --bg: #050505;
          --paper: #0a0a0a;
          --ink: #f8fafc;
          --ink-soft: #94a3b8;
          --accent: var(--gold, #c9a96e);
          --accent-soft: rgba(201, 169, 110, 0.3);
          --line: rgba(255, 255, 255, 0.08);
          --interviewer-bubble: #111111;
          --interviewer-bubble-border: rgba(255, 255, 255, 0.08);
          --student-bubble: rgba(16, 185, 129, 0.12);
          --student-bubble-border: rgba(16, 185, 129, 0.35);
          --tick-blue: #38bdf8;
        }

        .interview-copilot-container.dark {
          background: #050505;
          color: #f8fafc;
        }

        .interview-copilot-container.dark .copilot-app {
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .interview-copilot-container.dark .copilot-header {
          background: #0d0d0d;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .interview-copilot-container.dark .copilot-brandline h1 {
          color: #ffffff;
          font-family: 'EB Garamond', Georgia, serif;
          font-weight: 600;
        }

        .interview-copilot-container.dark .copilot-status-pill {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 3px 10px;
          font-family: monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-style: normal;
        }

        .interview-copilot-container.dark .copilot-status-pill.live {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.25);
        }

        .interview-copilot-container.dark .call-action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .interview-copilot-container.dark .call-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--gold, #c9a96e);
          color: #ffffff;
        }

        .interview-copilot-container.dark .copilot-setup {
          background: #0a0a0a;
        }

        .interview-copilot-container.dark .copilot-setup p.lede {
          color: #94a3b8;
        }

        .interview-copilot-container.dark .copilot-field label {
          color: #cbd5e1;
          font-weight: 600;
        }

        .interview-copilot-container.dark .copilot-field input,
        .interview-copilot-container.dark .copilot-field select,
        .interview-copilot-container.dark .copilot-field textarea {
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f8fafc;
          border-radius: 8px;
        }

        .interview-copilot-container.dark .copilot-field input:focus,
        .interview-copilot-container.dark .copilot-field select:focus,
        .interview-copilot-container.dark .copilot-field textarea:focus {
          border-color: var(--gold, #c9a96e);
          box-shadow: 0 0 10px rgba(201, 169, 110, 0.2);
          outline: none;
        }

        .interview-copilot-container.dark .copilot-field select option {
          background: #141414;
          color: #f8fafc;
        }

        .interview-copilot-container.dark .copilot-begin-btn {
          background: var(--gold, #c9a96e);
          color: #000000;
          font-weight: 700;
          border-radius: 10px;
          box-shadow: 0 0 15px rgba(201, 169, 110, 0.25);
        }

        .interview-copilot-container.dark .copilot-begin-btn:hover {
          background: #d8b77a;
          box-shadow: 0 0 20px rgba(201, 169, 110, 0.4);
        }

        .interview-copilot-container.dark .copilot-begin-btn:disabled {
          background: #262626;
          color: #666666;
          box-shadow: none;
        }

        .interview-copilot-container.dark .copilot-transcript {
          background-color: #050505;
          background-image: radial-gradient(rgba(255, 255, 255, 0.07) 0.6px, transparent 0.6px);
        }

        .interview-copilot-container.dark .copilot-day-chip {
          background: #151515;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }

        .interview-copilot-container.dark .copilot-msg.interviewer .copilot-bubble {
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }

        .interview-copilot-container.dark .copilot-msg .role {
          color: var(--gold, #c9a96e);
        }

        .interview-copilot-container.dark .copilot-msg.student .role {
          color: #4ade80;
        }

        .interview-copilot-container.dark .copilot-msg.student .copilot-bubble {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #f0fdf4;
        }

        .interview-copilot-container.dark .copilot-meta {
          color: #64748b;
        }

        .interview-copilot-container.dark .copilot-typing-bubble {
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .interview-copilot-container.dark .copilot-typing-bubble span {
          background: #94a3b8;
        }

        .interview-copilot-container.dark .copilot-thinking-badge {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #4ade80;
        }

        .interview-copilot-container.dark .copilot-thinking-spinner {
          border-color: rgba(74, 222, 128, 0.3);
          border-top-color: #4ade80;
        }

        .interview-copilot-container.dark .copilot-verdict {
          background: #111111;
          border: 1px solid rgba(201, 169, 110, 0.3);
          color: #f8fafc;
        }

        .interview-copilot-container.dark .copilot-verdict h3 {
          color: var(--gold, #c9a96e);
        }

        .interview-copilot-container.dark .copilot-verdict p,
        .interview-copilot-container.dark .copilot-verdict ul {
          color: #cbd5e1;
        }

        .interview-copilot-container.dark .copilot-verdict .score-tag {
          background: var(--gold, #c9a96e);
          color: #000000;
          font-weight: 800;
        }

        .interview-copilot-container.dark .copilot-voice-dock {
          background: rgba(10, 10, 10, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
        }

        .interview-copilot-container.dark .dock-status-text {
          color: #f8fafc;
        }

        .interview-copilot-container.dark .dock-wave-bar {
          background: rgba(255, 255, 255, 0.2);
        }

        .interview-copilot-container.dark .dock-wave-bar.active {
          background: #3b82f6;
        }

        .interview-copilot-container.dark .dock-wave-bar.ai-active {
          background: var(--gold, #c9a96e);
        }

        .interview-copilot-container.dark .call-action-btn.end {
          background: rgba(239, 68, 68, 0.12) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #f87171 !important;
        }

        .interview-copilot-container.dark .call-action-btn.end:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          border-color: #ef4444 !important;
        }

        .interview-copilot-container.dark .copilot-footer-row {
          background: #0a0a0a;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .interview-copilot-container.dark .copilot-restart-btn {
          background: var(--gold, #c9a96e);
          color: #000000;
          font-weight: 700;
        }

        .interview-copilot-container.dark .copilot-restart-btn:hover {
          background: #d8b77a;
        }

        .interview-copilot-container.dark .text-drawer {
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .interview-copilot-container.dark .text-drawer input {
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f8fafc;
        }

        .interview-copilot-container {
          background: var(--paper);
          color: var(--ink);
          font-family: 'EB Garamond', Garamond, 'Times New Roman', serif;
          -webkit-font-smoothing: antialiased;
          height: calc(100vh - 64px);
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: 0;
          overflow: hidden;
          box-sizing: border-box;
        }

        .copilot-app {
          width: 100%;
          max-width: 100%;
          margin: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--paper);
          border: none;
          box-shadow: none;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .copilot-header {
          padding: 16px 36px;
          border-bottom: 1px solid var(--line);
          background: var(--paper);
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .copilot-brandline {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
        }

        .copilot-brandline h1 {
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.2px;
          margin: 0;
          color: var(--ink);
          font-family: inherit;
        }

        .copilot-status-pill {
          font-size: 14px;
          font-style: italic;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .copilot-status-pill.live {
          color: #4C8A3F;
          font-weight: 600;
        }

        /* Setup Panel */
        .copilot-setup {
          flex: 1;
          padding: 24px 36px 32px;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .copilot-setup-inner {
          width: 100%;
          max-width: 100%;
        }

        .copilot-setup p.lede {
          font-size: 18px;
          line-height: 1.55;
          color: var(--ink-soft);
          max-width: 100%;
          margin: 0 0 20px;
        }

        .copilot-field {
          margin-bottom: 16px;
        }

        .copilot-field label {
          display: block;
          font-size: 14.5px;
          color: var(--ink-soft);
          margin-bottom: 5px;
          font-weight: 500;
        }

        .copilot-field input,
        .copilot-field select,
        .copilot-field textarea {
          width: 100%;
          font-family: inherit;
          font-size: 16px;
          color: var(--ink);
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 10px 13px;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .copilot-field textarea {
          resize: vertical;
          min-height: 54px;
        }

        .copilot-field input:focus,
        .copilot-field select:focus,
        .copilot-field textarea:focus {
          outline: none;
          border-color: var(--accent-soft);
        }

        .copilot-field-row {
          display: flex;
          gap: 20px;
        }

        .copilot-field-row .copilot-field {
          flex: 1;
        }

        @media (max-width: 768px) {
          .copilot-field-row {
            flex-direction: column;
            gap: 0;
          }
          .copilot-header {
            padding: 14px 20px;
          }
          .copilot-setup {
            padding: 18px 20px;
          }
        }

        .copilot-begin-btn {
          margin-top: 4px;
          background: var(--ink);
          color: var(--paper);
          border: none;
          font-family: inherit;
          font-size: 17px;
          letter-spacing: 0.3px;
          padding: 12px 30px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .copilot-begin-btn:hover {
          background: var(--accent);
        }

        .copilot-begin-btn:disabled {
          background: #B8AC91;
          cursor: default;
        }

        /* Transcript */
        .copilot-transcript {
          flex: 1;
          padding: 20px 36px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-image: radial-gradient(var(--line) 0.6px, transparent 0.6px);
          background-size: 18px 18px;
          background-color: var(--bg);
          min-height: 0;
          box-sizing: border-box;
          width: 100%;
        }

        .copilot-day-chip {
          align-self: center;
          background: #fff;
          color: var(--ink-soft);
          font-size: 13px;
          font-style: italic;
          padding: 4px 14px;
          border-radius: 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          margin: 6px 0 10px;
        }

        .copilot-msg {
          display: flex;
          flex-direction: column;
          max-width: 78%;
          position: relative;
        }

        .copilot-msg.interviewer {
          align-self: flex-start;
        }

        .copilot-msg.student {
          align-self: flex-end;
          align-items: flex-end;
        }

        .copilot-msg .role {
          font-size: 12.5px;
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 2px;
          padding: 0 4px;
        }

        .copilot-msg.student .role {
          color: #4C8A3F;
        }

        .copilot-bubble {
          padding: 9px 12px 8px;
          border-radius: var(--radius);
          font-size: 17px;
          line-height: 1.55;
          box-shadow: 0 1px 1.5px rgba(0,0,0,0.08);
          position: relative;
          word-break: break-word;
        }

        .copilot-msg.interviewer .copilot-bubble {
          background: var(--interviewer-bubble);
          border-top-left-radius: 2px;
        }

        .copilot-msg.student .copilot-bubble {
          background: var(--student-bubble);
          border: 1px solid var(--student-bubble-border);
          border-top-right-radius: 2px;
        }

        .copilot-msg.student .copilot-bubble.interim {
          opacity: 0.85;
          font-style: italic;
          border-style: dashed;
        }

        .copilot-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          font-size: 11.5px;
          color: var(--ink-soft);
          margin-top: 3px;
          opacity: 0.85;
        }

        .copilot-meta .tick {
          color: var(--tick-blue);
          font-size: 13px;
          line-height: 1;
          font-weight: bold;
        }

        .copilot-meta .replay-link {
          cursor: pointer;
          color: var(--accent);
          text-decoration: underline;
          margin-right: 4px;
        }

        .copilot-typing-bubble {
          align-self: flex-start;
          background: var(--interviewer-bubble);
          border-radius: var(--radius);
          border-top-left-radius: 2px;
          padding: 11px 16px;
          box-shadow: 0 1px 1.5px rgba(0,0,0,0.08);
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .copilot-typing-bubble span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink-soft);
          opacity: 0.5;
          animation: copilot-bounce 1.1s infinite ease-in-out;
        }

        .copilot-typing-bubble span:nth-child(2) { animation-delay: 0.15s; }
        .copilot-typing-bubble span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes copilot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 0.9; }
        }

        .copilot-thinking-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
          background: rgba(43, 90, 75, 0.08);
          border: 1px solid rgba(43, 90, 75, 0.22);
          color: #2B5A4B;
          font-size: 12.5px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 14px;
          animation: copilotFadeIn 0.25s ease-out;
        }

        .copilot-thinking-spinner {
          width: 10px;
          height: 10px;
          border: 2px solid #C4E1A6;
          border-top-color: #2B5A4B;
          border-radius: 50%;
          animation: copilotSpin 0.8s linear infinite;
        }

        @keyframes copilotFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Verdict / Evaluation Card matching HTML */
        .copilot-verdict {
          margin: 14px auto 6px;
          max-width: 94%;
          padding: 20px 24px;
          border: 1px solid var(--accent-soft);
          background: #FBF6E9;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          width: 100%;
        }

        .copilot-verdict h3 {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 600;
          color: var(--accent);
        }

        .copilot-verdict p {
          margin: 0 0 8px;
          font-size: 16.5px;
          line-height: 1.6;
          color: var(--ink);
        }

        .copilot-verdict .score-tag {
          display: inline-block;
          background: var(--ink);
          color: var(--paper);
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .copilot-verdict ul {
          margin: 6px 0 10px 20px;
          padding: 0;
          font-size: 16px;
          line-height: 1.5;
          color: var(--ink);
        }

        .copilot-verdict li {
          margin-bottom: 4px;
        }

        /* PURE REAL PHONE CALL BAR (NO PUSH-TO-TALK BUTTONS!) */
        .copilot-voice-dock {
          border-top: 1px solid var(--line);
          background: var(--paper);
          padding: 14px 36px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
          box-shadow: 0 -4px 20px rgba(60,45,20,0.04);
          box-sizing: border-box;
          width: 100%;
        }

        .dock-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
        }

        .dock-status-text {
          font-size: 16px;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dock-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4C8A3F;
          display: inline-block;
          box-shadow: 0 0 8px #4C8A3F;
          animation: copilot-pulse 1.8s infinite ease-in-out;
        }

        .dock-status-dot.speaking {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
        }

        .dock-status-dot.user-talking {
          background: #2563EB;
          box-shadow: 0 0 8px #2563EB;
        }

        @keyframes copilot-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* Voice Waveform Bars */
        .dock-waveform {
          display: flex;
          align-items: center;
          gap: 2.5px;
          height: 22px;
        }

        .dock-wave-bar {
          width: 3px;
          background: var(--ink-soft);
          border-radius: 2px;
          transition: height 0.08s ease;
          opacity: 0.4;
        }

        .dock-wave-bar.active {
          background: #2563EB;
          opacity: 1;
        }

        .dock-wave-bar.ai-active {
          background: var(--accent);
          opacity: 1;
        }

        .call-action-btn {
          font-family: inherit;
          font-size: 15px;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .call-action-btn:hover {
          border-color: var(--accent-soft);
          background: var(--paper);
        }

        .call-action-btn.end {
          color: #A94442;
          border-color: #EBCCD1;
          background: #FDF7F7;
        }

        .call-action-btn.end:hover {
          background: #F2DEDE;
          border-color: #A94442;
        }

        /* Footer restart row */
        .copilot-footer-row {
          border-top: 1px solid var(--line);
          padding: 18px 44px 24px;
          display: flex;
          justify-content: center;
          background: var(--paper);
        }

        .copilot-restart-btn {
          background: var(--ink);
          color: var(--paper);
          border: none;
          font-family: inherit;
          font-size: 16px;
          padding: 11px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .copilot-restart-btn:hover {
          background: var(--accent);
        }

        .text-drawer {
          border-top: 1px dashed var(--line);
          padding-top: 10px;
          display: flex;
          gap: 8px;
        }

        .text-drawer input {
          flex: 1;
          font-family: inherit;
          font-size: 16px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: #fff;
          color: var(--ink);
        }

        @keyframes copilotSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* CENTERED APP CONTAINER */}
      <div className="copilot-app">
        {/* HEADER */}
        <header className="copilot-header">
          <div className="copilot-brandline">
            <h1>Interview Copilot</h1>
            <span
              className={`copilot-status-pill ${
                phase === "live" ? "live" : ""
              }`}
            >
              {phase === "setup"
                ? "not started"
                : isInitializing && messages.length === 0
                ? "connecting call..."
                : phase === "live"
                ? "live call connected"
                : "finished"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenPastSessions}
            className="call-action-btn"
            style={{ fontSize: "13px", padding: "6px 14px", cursor: "pointer", marginLeft: "auto" }}
          >
            📋 Past Sessions
          </button>
        </header>

        {/* ============================================================ */}
        {/* VIEW 1: SETUP PANEL (EXACTLY MATCHING ai-interview-copilot.html) */}
        {/* ============================================================ */}
        {phase === "setup" && (
          <section className="copilot-setup">
            <p className="lede">
              Real 1-on-1 voice interview call with Orion — hands-free and continuous like a real phone call. Just speak naturally, whenever you talk Orion responds.
            </p>

            {sessionError && (
              <div
                style={{
                  background: "#F2DEDE",
                  border: "1px solid #EBCCD1",
                  color: "#A94442",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "15px",
                  marginBottom: "16px",
                }}
              >
                {sessionError}
              </div>
            )}

            <div className="copilot-field">
              <label htmlFor="roleInput">Role / position being interviewed for</label>
              <input
                type="text"
                id="roleInput"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g. Computer Engineering internship, Backend Developer, Full Stack"
              />
            </div>

            <div className="copilot-field-row">
              <div className="copilot-field">
                <label htmlFor="levelInput">Level</label>
                <select
                  id="levelInput"
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value)}
                >
                  <option>Student / Fresher</option>
                  <option>Internship</option>
                  <option>Entry-level</option>
                  <option>Experienced / Senior</option>
                </select>
              </div>

              <div className="copilot-field">
                <label htmlFor="styleInput">Interview style</label>
                <select
                  id="styleInput"
                  value={styleInput}
                  onChange={(e) => setStyleInput(e.target.value)}
                >
                  <option>Balanced (technical + HR)</option>
                  <option>Purely technical</option>
                  <option>Purely HR / behavioural</option>
                  <option>Viva / academic</option>
                </select>
              </div>
            </div>

            <div className="copilot-field-row">
              <div className="copilot-field">
                <label htmlFor="focusInput">
                  Anything specific the interviewer should focus on (optional)
                </label>
                <textarea
                  id="focusInput"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  placeholder="e.g. DBMS, OOP, React, System Design, my internship project, resume questions"
                  rows={2}
                />
              </div>

              <div className="copilot-field">
                <label htmlFor="candidateInput">
                  Who is the candidate? (optional)
                </label>
                <input
                  type="text"
                  id="candidateInput"
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  placeholder="e.g. a final-year Computer Engineering student, slightly nervous but well-prepared"
                />
              </div>
            </div>

            <button
              className="copilot-begin-btn"
              disabled={isInitializing}
              onClick={handleStartInterview}
            >
              {isInitializing ? "Connecting call..." : "Start interview"}
            </button>
          </section>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: LIVE TRANSCRIPT & VOICE AGENT DIALOGUE */}
        {/* ============================================================ */}
        {(phase === "live" || phase === "finished") && (
          <div className="copilot-transcript">
            <div className="copilot-day-chip">Today</div>

            {/* INITIAL CONNECTING INDICATOR */}
            {isInitializing && messages.length === 0 && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                textAlign: "center",
                gap: "14px",
                margin: "auto"
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "3px solid var(--accent-soft)",
                  borderTopColor: "var(--accent)",
                  animation: "copilotSpin 0.9s linear infinite"
                }} />
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)" }}>
                  Connecting secure audio line with Orion...
                </div>
                <div style={{ fontSize: "14px", color: "var(--ink-soft)", maxWidth: "420px", lineHeight: "1.4" }}>
                  Activating hands-free audio engine. Orion will introduce the interview in a moment. Speak naturally at any time.
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isInterviewer = msg.role === "interviewer";
              return (
                <div
                  key={msg.id || idx}
                  className={`copilot-msg ${
                    isInterviewer ? "interviewer" : "student"
                  }`}
                >
                  <div className="role">
                    {isInterviewer ? "Interviewer • Orion" : "You (Candidate)"}
                  </div>

                  <div className="copilot-bubble">
                    {msg.content}
                  </div>

                  <div className="copilot-meta">
                    {isInterviewer && (
                      <span
                        className="replay-link"
                        onClick={() => handleReplayAudio(msg)}
                        title="Replay speech audio"
                      >
                        🔊 Replay
                      </span>
                    )}
                    <span className="time">{msg.timeStr || formatTime(msg.created_at)}</span>
                    {!isInterviewer && <span className="tick">✓✓</span>}
                  </div>

                  {/* Orion Thinking Badge directly under candidate message */}
                  {!isInterviewer && idx === messages.length - 1 && isSubmittingAnswer && (
                    <div className="copilot-thinking-badge">
                      <span className="copilot-thinking-spinner" />
                      <span>Orion is thinking & preparing response...</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* LIVE CANDIDATE SPEECH REAL-TIME PRINTING BUBBLE */}
            {isUserSpeaking && interimTranscript && (
              <div className="copilot-msg student">
                <div className="role">You (Candidate) • Speaking...</div>
                <div className="copilot-bubble interim">
                  {interimTranscript}
                </div>
              </div>
            )}

            {/* TYPING BUBBLE INDICATOR FOR ORION */}
            {(isSubmittingAnswer || isInterviewerSpeaking) && (
              <div className="copilot-typing-bubble">
                <span />
                <span />
                <span />
              </div>
            )}

            {/* VERDICT / EVALUATION REPORT AT END */}
            {phase === "finished" && evaluationReport && (
              <div style={{ width: "100%", margin: "16px 0" }}>
                <EvaluationReport
                  session={currentSession}
                  report={evaluationReport}
                  onStartNewInterview={handleRestart}
                  onViewHistory={handleOpenPastSessions}
                />
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        )}

        {/* ============================================================ */}
        {/* REAL PHONE CALL BAR (100% HANDS-FREE — NO PUSH TO TALK BUTTON!) */}
        {/* ============================================================ */}
        {phase === "live" && (
          <div className="copilot-voice-dock">
            <div className="dock-controls-row">
              {/* LIVE CALL STATUS & REAL-TIME AUDIO WAVEFORM */}
              <div className="dock-status-text">
                <span
                  className={`dock-status-dot ${
                    isInterviewerSpeaking
                      ? "speaking"
                      : isUserSpeaking
                      ? "user-talking"
                      : ""
                  }`}
                />
                <span>
                  {isInitializing && messages.length === 0
                    ? "Connecting secure line with Orion..."
                    : isSubmittingAnswer
                    ? "Orion is thinking..."
                    : isInterviewerSpeaking
                    ? "Orion is speaking..."
                    : isUserSpeaking
                    ? "Listening to you speak..."
                    : "Connected • Speak naturally whenever you want"}
                </span>

                {/* WAVEFORM BARS */}
                <div className="dock-waveform" style={{ marginLeft: "8px" }}>
                  {[...Array(14)].map((_, i) => {
                    const activeLevel = isInterviewerSpeaking
                      ? interviewerLevel
                      : audioLevel;
                    const h = Math.max(4, Math.min(22, activeLevel * 24 * (1 - Math.abs(i - 7) / 9)));
                    const isAi = isInterviewerSpeaking;
                    const isCandidate = isUserSpeaking;
                    return (
                      <div
                        key={i}
                        className={`dock-wave-bar ${
                          isAi
                            ? "ai-active"
                            : isCandidate
                            ? "active"
                            : activeLevel > 0.08
                            ? "active"
                            : ""
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* CALL ACTIONS (END CALL, BARGE IN, TYPE FALLBACK) */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isInterviewerSpeaking && (
                  <button
                    type="button"
                    className="call-action-btn"
                    onClick={() => stopAudio()}
                    title="Interrupt Orion immediately"
                  >
                    ✋ Interrupt
                  </button>
                )}

                <button
                  type="button"
                  className="call-action-btn"
                  onClick={() => setShowTextInput(!showTextInput)}
                  title="Type your answer instead"
                >
                  💬 Type
                </button>

                <button
                  type="button"
                  className="call-action-btn end"
                  onClick={handleEndCall}
                >
                  End Call
                </button>
              </div>
            </div>

            {/* TEXT FALLBACK DRAWER */}
            {showTextInput && (
              <form className="text-drawer" onSubmit={handleSubmitTextAnswer}>
                <input
                  type="text"
                  placeholder="Type your response and press Enter..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="call-action-btn">
                  Send
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* FOOTER ROW WHEN FINISHED */}
        {/* ============================================================ */}
        {phase === "finished" && (
          <div className="copilot-footer-row">
            <button className="copilot-restart-btn" onClick={handleRestart}>
              Run another interview
            </button>
          </div>
        )}
      </div>

      {/* PAST SESSIONS MODAL */}
      <PastSessionsModal
        isOpen={showPastModal}
        onClose={() => setShowPastModal(false)}
        sessions={pastSessions}
        isLoading={isLoadingPast}
        onSelectSession={handleSelectPastSession}
      />
    </div>
  );
};

export default InterviewCopilotOutlet;
