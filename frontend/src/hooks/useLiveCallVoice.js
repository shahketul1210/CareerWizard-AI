import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Validates if candidate speech is meaningful (filters out stray noise, mic pops, coughs, and 1-syllable hallucinations).
 */
function isMeaningfulSpeech(text) {
  if (!text) return false;
  const cleaned = text.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  const noiseWords = new Set([
    "um", "uh", "ah", "hmm", "hm", "oh", "er", "like", "you", "so", "a", "an", "the", "hi", "hey"
  ]);

  // Single word that matches a common stray noise/grunt
  if (words.length === 1 && noiseWords.has(words[0].toLowerCase())) {
    return false;
  }

  // Must have at least 2 words OR at least 7 non-whitespace characters
  return words.length >= 2 || cleaned.replace(/\s+/g, "").length >= 7;
}

export function useLiveCallVoice({
  onSpeechFinal = null,
  isAiSpeaking = false,
} = {}) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Core references
  const recognitionRef = useRef(null);
  const recognitionStateRef = useRef("idle"); // "idle" | "starting" | "listening" | "stopping"
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const echoCooldownTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Audio recording for high-accuracy Deepgram Nova-2 STT
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // State guards
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isEchoCooldownRef = useRef(false);
  const onSpeechFinalRef = useRef(onSpeechFinal);
  const isCallActiveRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");
  const lastDispatchedTextRef = useRef("");

  // Sync props
  useEffect(() => {
    onSpeechFinalRef.current = onSpeechFinal;
  }, [onSpeechFinal]);

  // Handle AI speaking transitions (Acoustic Echo Isolation)
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;

    if (isAiSpeaking) {
      // AI started speaking: immediately silence mic input to prevent speaker echo
      isEchoCooldownRef.current = true;
      accumulatedTranscriptRef.current = "";
      setInterimTranscript("");
      setIsUserSpeaking(false);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Stop any active candidate recording slice
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      recordedChunksRef.current = [];
    } else {
      // AI finished speaking: allow 350ms acoustic dissipation so room reverb clears
      if (echoCooldownTimerRef.current) clearTimeout(echoCooldownTimerRef.current);
      echoCooldownTimerRef.current = setTimeout(() => {
        isEchoCooldownRef.current = false;
        accumulatedTranscriptRef.current = "";
        setInterimTranscript("");
        setIsUserSpeaking(false);

        // Ensure recognition is ready and listening for candidate's natural reply
        if (isCallActiveRef.current && recognitionStateRef.current === "idle") {
          startRecognitionSafe();
        }
      }, 350);
    }
  }, [isAiSpeaking]);

  // Audio frequency analyser for real-time waveform bars
  const startAudioMeter = useCallback((stream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);

        // Vocal frequency bins
        let sum = 0;
        let count = 0;
        for (let i = 1; i < Math.min(data.length, 16); i++) {
          sum += data[i];
          count++;
        }
        const avg = count > 0 ? sum / count : 0;
        const normalized = Math.min(1, avg / 85);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn("Audio meter init note:", e);
    }
  }, []);

  // Safe speech dispatcher (delivers audio blob & text, cleanly resets turn state)
  const dispatchFinalSpeech = useCallback((text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || !isMeaningfulSpeech(trimmed)) return;
    if (trimmed === lastDispatchedTextRef.current) return;

    lastDispatchedTextRef.current = trimmed;

    // Assemble audio blob if recorded
    let audioBlob = null;
    if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      } catch (e) {
        console.warn("Could not create audio blob:", e);
      }
    }
    recordedChunksRef.current = [];

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Deliver final speech to parent optimistic handler BEFORE resetting local interim state
    // This allows React 18 to batch optimistic bubble commitment and clearing in a single render pass
    if (onSpeechFinalRef.current) {
      onSpeechFinalRef.current({ text: trimmed, audioBlob });
    }

    accumulatedTranscriptRef.current = "";
    setInterimTranscript("");
    setIsUserSpeaking(false);

    // Gently restart speech recognition to reset Chrome's internal resultIndex for the next question
    if (recognitionRef.current && recognitionStateRef.current === "listening") {
      try {
        recognitionStateRef.current = "stopping";
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // Helper to start MediaRecorder for high accuracy Deepgram STT
  const startRecordingChunk = useCallback(() => {
    if (!streamRef.current || !streamRef.current.active) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") return;

    try {
      recordedChunksRef.current = [];
      let options = { mimeType: "audio/webm;codecs=opus" };
      if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/webm" };
      }

      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
    } catch (e) {
      console.warn("MediaRecorder start notice:", e);
    }
  }, []);

  // Continuous Speech Recognition with state machine & anti-crash protection
  const startRecognitionSafe = useCallback(() => {
    if (!isCallActiveRef.current) return;
    if (isAiSpeakingRef.current || isEchoCooldownRef.current) return;
    if (
      recognitionStateRef.current === "listening" ||
      recognitionStateRef.current === "starting"
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    try {
      recognitionStateRef.current = "starting";

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;

      // Smart locale detection: optimize for Indian English or browser default
      let isIndia = false;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        isIndia =
          tz.includes("Calcutta") ||
          tz.includes("Kolkata") ||
          (navigator.language && navigator.language.includes("IN"));
      } catch (e) {}

      recognition.lang = isIndia ? "en-IN" : navigator.language || "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recognitionStateRef.current = "listening";
      };

      recognition.onresult = (event) => {
        // Echo isolation: if AI is speaking or room echo cooldown active, drop immediately
        if (isAiSpeakingRef.current || isEchoCooldownRef.current) {
          return;
        }

        let currentInterim = "";
        let newFinalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) {
            newFinalChunk += transcript + " ";
          } else {
            currentInterim += transcript;
          }
        }

        if (newFinalChunk) {
          accumulatedTranscriptRef.current += newFinalChunk;
        }

        const fullSpoken = (
          accumulatedTranscriptRef.current +
          " " +
          currentInterim
        ).trim();

        if (fullSpoken) {
          setIsUserSpeaking(true);
          setInterimTranscript(fullSpoken); // Live instant screen printing!

          // Start audio slice capture if not yet recording
          startRecordingChunk();
        }

        // Reset silence detection timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Adaptive conversational turn-taking pause:
        // - Fast-path (900ms) if utterance ends with punctuation (. ? !) or has >= 10 words
        // - Standard conversational pause (1200ms) for normal utterances (>= 5 words)
        // - Guarded pause (1300ms) for brief utterances (< 5 words)
        const wordCount = fullSpoken.split(/\s+/).filter(Boolean).length;
        const hasPunctuation = /[.?!]$/.test(fullSpoken.trim());
        const silenceTimeoutMs = (hasPunctuation || wordCount >= 10) ? 900 : wordCount >= 5 ? 1200 : 1300;

        silenceTimerRef.current = setTimeout(() => {
          if (
            fullSpoken &&
            !isAiSpeakingRef.current &&
            !isEchoCooldownRef.current &&
            isCallActiveRef.current &&
            isMeaningfulSpeech(fullSpoken)
          ) {
            dispatchFinalSpeech(fullSpoken);
          }
        }, silenceTimeoutMs);
      };

      recognition.onerror = (event) => {
        // 'no-speech' is expected during normal quiet pauses; ignore
        if (event.error === "no-speech") {
          return;
        }
        if (event.error === "aborted") {
          return;
        }
        console.warn("Speech recognition notice:", event.error);
      };

      recognition.onend = () => {
        recognitionStateRef.current = "idle";
        recognitionRef.current = null;

        // Auto-reconnect seamlessly if call is still active and Orion is not speaking
        if (isCallActiveRef.current && !isAiSpeakingRef.current && !isEchoCooldownRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isCallActiveRef.current && !isAiSpeakingRef.current) {
              startRecognitionSafe();
            }
          }, 250);
        }
      };

      recognition.start();
    } catch (err) {
      recognitionStateRef.current = "idle";
      console.warn("Speech recognition start notice:", err);
      // Safe retry after 400ms
      if (isCallActiveRef.current && !isAiSpeakingRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isCallActiveRef.current) {
            startRecognitionSafe();
          }
        }, 400);
      }
    }
  }, [dispatchFinalSpeech, startRecordingChunk]);

  // Start continuous hands-free phone call
  const startCall = useCallback(async () => {
    try {
      setIsCallActive(true);
      isCallActiveRef.current = true;
      isEchoCooldownRef.current = false;
      accumulatedTranscriptRef.current = "";
      lastDispatchedTextRef.current = "";

      // 1. Get continuous audio stream with echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      startAudioMeter(stream);

      // 2. Start continuous speech recognition
      startRecognitionSafe();

      return true;
    } catch (err) {
      console.error("Failed to start live call voice:", err);
      setIsCallActive(false);
      isCallActiveRef.current = false;
      return false;
    }
  }, [startAudioMeter, startRecognitionSafe]);

  // End call and tear down resources cleanly
  const endCall = useCallback(() => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setIsUserSpeaking(false);
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    lastDispatchedTextRef.current = "";
    isEchoCooldownRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (echoCooldownTimerRef.current) {
      clearTimeout(echoCooldownTimerRef.current);
      echoCooldownTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    recordedChunksRef.current = [];

    if (recognitionRef.current) {
      try {
        recognitionStateRef.current = "stopping";
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
      recognitionStateRef.current = "idle";
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isCallActive,
    isUserSpeaking,
    interimTranscript,
    audioLevel,
    startCall,
    endCall,
  };
}

export default useLiveCallVoice;
