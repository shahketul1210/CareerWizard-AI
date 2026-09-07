import { useState, useRef, useEffect, useCallback } from "react";

export function useVoiceRecorder({
  isAutoMode = true,
  silenceThresholdMs = 1300,
  minSpeechDurationMs = 800,
  isAiSpeaking = false,
  onSpeechFinalized = null,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const isSpeakingRef = useRef(false);
  const speechStartTimeRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isMutedRef = useRef(isMuted);
  const onSpeechFinalizedRef = useRef(onSpeechFinalized);

  // Keep refs synced to latest props
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    onSpeechFinalizedRef.current = onSpeechFinalized;
  }, [onSpeechFinalized]);

  // Request & start continuous microphone stream (Google Meet style)
  const startContinuousListening = useCallback(async () => {
    try {
      setPermissionError(null);

      // If stream already active, don't recreate
      if (streamRef.current && streamRef.current.active) {
        setIsListening(true);
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);
      return true;
    } catch (err) {
      console.error("Microphone access error:", err);
      setHasPermission(false);
      setPermissionError(
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please enable microphone permissions in your browser."
          : "Could not access microphone. Please check your audio settings."
      );
      setIsListening(false);
      return false;
    }
  }, []);

  // Internal helper to start MediaRecorder recording slice
  const beginRecordingSlice = useCallback(() => {
    if (!streamRef.current || !streamRef.current.active) return;

    recordedChunksRef.current = [];
    let options = { mimeType: "audio/webm;codecs=opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      } else {
        options = {};
      }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      speechStartTimeRef.current = Date.now();
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    } catch (e) {
      console.warn("Failed to begin MediaRecorder slice:", e);
    }
  }, []);

  // Internal helper to finish and dispatch recorded speech blob
  const finishRecordingSlice = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    const duration = Date.now() - speechStartTimeRef.current;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      recordedChunksRef.current = [];
      mediaRecorderRef.current = null;

      // Only dispatch if speech duration was valid
      if (duration >= minSpeechDurationMs && blob.size > 800) {
        if (onSpeechFinalizedRef.current) {
          onSpeechFinalizedRef.current(blob);
        }
      }
    };

    recorder.stop();
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, [minSpeechDurationMs]);

  // VAD Volume / Energy Meter Loop
  useEffect(() => {
    if (!isListening) return;

    let localAnimationFrame;

    const checkAudioLevel = () => {
      if (!analyserRef.current || isMutedRef.current) {
        setAudioLevel(0);
        localAnimationFrame = requestAnimationFrame(checkAudioLevel);
        return;
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1, average / 128);
      setAudioLevel(normalized);

      // Don't auto-record if AI is speaking, unless candidate speaks loudly (barge-in)
      const isOverAi = isAiSpeakingRef.current;
      const voiceThreshold = isOverAi ? 0.22 : 0.08;

      if (isAutoMode) {
        if (normalized >= voiceThreshold) {
          // Candidate is speaking!
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (!isSpeakingRef.current) {
            beginRecordingSlice();
          }
        } else {
          // Sound is below voice threshold (silence/pause)
          if (isSpeakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              finishRecordingSlice();
              silenceTimerRef.current = null;
            }, silenceThresholdMs);
          }
        }
      }

      localAnimationFrame = requestAnimationFrame(checkAudioLevel);
    };

    localAnimationFrame = requestAnimationFrame(checkAudioLevel);

    return () => {
      if (localAnimationFrame) {
        cancelAnimationFrame(localAnimationFrame);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [isListening, isAutoMode, beginRecordingSlice, finishRecordingSlice, silenceThresholdMs]);

  // Manual fallback stop
  const stopRecordingManual = useCallback(() => {
    return new Promise((resolve) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve(null);
        return;
      }

      const recorder = mediaRecorderRef.current;
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  // Toggle Mute (Like Google Meet Mic Button)
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && isSpeakingRef.current) {
        // If muting while speaking, cancel recording
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    audioLevel,
    isMuted,
    hasPermission,
    permissionError,
    startContinuousListening,
    stopRecordingManual,
    beginRecordingSlice,
    toggleMute,
  };
}
