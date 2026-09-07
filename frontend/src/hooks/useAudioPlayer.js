import { useState, useRef, useEffect, useCallback } from "react";

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [interviewerLevel, setInterviewerLevel] = useState(0);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  // Stop playback instantly (Barge-in / Interrupt)
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    setInterviewerLevel(0);
  }, []);

  // Play audio from base64 data URL or URL
  const playAudio = useCallback(
    (audioSource, onEndedCallback) => {
      if (!audioSource) return;

      stopAudio();

      const audio = new Audio(audioSource);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        // Start simulated natural waveform oscillation for the AI speech
        let step = 0;
        const animate = () => {
          step += 0.2;
          const level = 0.35 + Math.sin(step) * 0.25 + Math.cos(step * 2.3) * 0.15;
          setInterviewerLevel(Math.max(0.1, Math.min(0.9, level)));
          animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
      };

      audio.onended = () => {
        stopAudio();
        if (onEndedCallback) {
          onEndedCallback();
        }
      };

      audio.onerror = (e) => {
        console.warn("Audio playback error:", e);
        stopAudio();
      };

      audio.play().catch((err) => {
        console.warn("Audio autoplay blocked or failed:", err);
        stopAudio();
      });
    },
    [stopAudio]
  );

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    isPlaying,
    interviewerLevel,
    playAudio,
    stopAudio,
  };
}
