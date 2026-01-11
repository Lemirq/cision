"use client";

import { motion } from "framer-motion";
import { Lightbulb, DollarSign, TrendingUp } from "lucide-react";
import type { ImprovementSuggestion } from "@/types/safety-audit";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
  suggestion: ImprovementSuggestion;
  index: number;
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const priorityColors = {
    high: {
      bg: "bg-green-500/10",
      border: "border-green-700/50",
      text: "text-green-400",
      badge: "bg-green-900/50 text-green-400 border-green-700/50",
    },
    medium: {
      bg: "bg-amber-500/10",
      border: "border-amber-700/50",
      text: "text-amber-400",
      badge: "bg-amber-900/50 text-amber-400 border-amber-700/50",
    },
    low: {
      bg: "bg-blue-500/10",
      border: "border-blue-700/50",
      text: "text-blue-400",
      badge: "bg-blue-900/50 text-blue-400 border-blue-700/50",
    },
  };

  const colors = priorityColors[suggestion.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "rounded-lg border p-4 space-y-3",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Lightbulb className={`h-4 w-4 ${colors.text} mt-0.5 shrink-0`} />
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${colors.text} mb-1`}>
              {suggestion.title}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {suggestion.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-wider",
            colors.badge
          )}
        >
          {suggestion.priority} priority
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
        <div className="flex items-start gap-2 min-w-0">
          <DollarSign className="h-3 w-3 text-zinc-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">Cost</p>
            <p className="text-xs text-zinc-300 font-medium truncate">
              {suggestion.estimatedCost}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <TrendingUp className="h-3 w-3 text-zinc-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">Impact</p>
            <p className="text-xs text-zinc-300 font-medium truncate">
              {suggestion.expectedImpact}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
