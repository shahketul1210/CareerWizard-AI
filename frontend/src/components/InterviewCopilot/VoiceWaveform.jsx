import React from "react";
import { motion } from "framer-motion";

export const VoiceWaveform = ({
  isActive = false,
  level = 0,
  mode = "interviewer", // "interviewer" (cyan/indigo) or "candidate" (emerald/cyan)
  barCount = 28,
  className = "",
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  // Color schemes matching the dark/light design system
  const isInterviewer = mode === "interviewer";
  const primaryGradient = isInterviewer
    ? "from-cyan-400 via-sky-400 to-indigo-500"
    : "from-emerald-400 via-teal-400 to-cyan-500";
  const glowColor = isInterviewer
    ? "rgba(34, 211, 238, 0.4)"
    : "rgba(52, 211, 153, 0.4)";

  return (
    <div className={`relative flex items-center justify-center gap-[3px] h-16 px-4 py-2 ${className}`}>
      {/* Background glow when active */}
      {isActive && (
        <div
          className="absolute inset-x-8 inset-y-2 rounded-full blur-xl transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: glowColor,
            opacity: Math.max(0.2, level * 0.8),
          }}
        />
      )}

      {bars.map((idx) => {
        // Curve factor so middle bars are naturally taller
        const centerDistance = Math.abs(idx - barCount / 2) / (barCount / 2);
        const curve = 1 - Math.pow(centerDistance, 1.4) * 0.65;

        // Dynamic height based on audio level + sine phase
        const phase = (idx / barCount) * Math.PI * 2;
        const oscillation = isActive ? Math.sin(phase + Date.now() / 200) * 0.2 : 0;
        const dynamicFactor = isActive ? Math.max(0.12, (level * 0.85 + oscillation) * curve) : 0.08;
        const barHeight = Math.max(4, Math.min(54, dynamicFactor * 54));

        return (
          <motion.div
            key={idx}
            className={`w-[3px] rounded-full transition-all duration-75 ${
              isActive
                ? `bg-gradient-to-t ${primaryGradient}`
                : "bg-slate-300 dark:bg-slate-700/60"
            }`}
            style={{
              height: `${barHeight}px`,
              boxShadow: isActive && dynamicFactor > 0.3 ? `0 0 8px ${glowColor}` : "none",
            }}
            animate={{
              scaleY: isActive ? [0.9, 1.1, 0.95] : 1,
            }}
            transition={{
              repeat: isActive ? Infinity : 0,
              duration: 0.8 + (idx % 5) * 0.1,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

export default VoiceWaveform;
