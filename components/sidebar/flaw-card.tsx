"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { SafetyFlaw } from "@/types/safety-audit";
import { cn } from "@/lib/utils";

interface FlawCardProps {
  flaw: SafetyFlaw;
  index: number;
}

export function FlawCard({ flaw, index }: FlawCardProps) {
  const severityColors = {
    high: {
      bg: "bg-red-500/20",
      border: "border-red-700/50",
      text: "text-red-400",
      badge: "bg-red-900/50 text-red-400 border-red-700/50",
    },
    medium: {
      bg: "bg-amber-500/20",
      border: "border-amber-700/50",
      text: "text-amber-400",
      badge: "bg-amber-900/50 text-amber-400 border-amber-700/50",
    },
    low: {
      bg: "bg-blue-500/20",
      border: "border-blue-700/50",
      text: "text-blue-400",
      badge: "bg-blue-900/50 text-blue-400 border-blue-700/50",
    },
  };

  const colors = severityColors[flaw.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "rounded-lg border p-3 space-y-2",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <AlertTriangle className={`h-4 w-4 ${colors.text} mt-0.5 shrink-0`} />
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>
              {flaw.title}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {flaw.description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-wider",
            colors.badge
          )}
        >
          {flaw.severity}
        </span>
        {flaw.category && (
          <span className="text-xs text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/50">
            {flaw.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}
