"use client";

import { motion } from "framer-motion";

interface SeverityProgressBarProps {
  score: number;
}

export function SeverityProgressBar({ score }: SeverityProgressBarProps) {
  const totalSegments = 15;
  const filledSegments = Math.round((score / 100) * totalSegments);
  
  const getStatus = () => {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    return "MODERATE";
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-sm" />
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
            Severity Status
          </span>
        </div>
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
          {getStatus()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
          Severity Score
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          className="text-4xl font-bold text-white font-mono"
        >
          {score}
        </motion.span>
      </div>

      <div className="space-y-1">
        <div className="flex gap-1">
          {Array.from({ length: totalSegments }).map((_, index) => {
            const isFilled = index < filledSegments;
            return (
              <motion.div
                key={index}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: 1, 
                  opacity: 1,
                  backgroundColor: isFilled ? "rgb(255, 255, 255)" : "rgb(39, 39, 42)"
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: "easeOut"
                }}
                className={`flex-1 h-6 rounded-sm ${
                  isFilled ? "bg-white" : "bg-zinc-800"
                }`}
                style={{ transformOrigin: "left" }}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-400 font-mono">0</span>
          <span className="text-xs text-zinc-400 font-mono">100</span>
        </div>
      </div>
    </div>
  );
}
