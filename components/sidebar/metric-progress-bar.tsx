"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricProgressBarProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: "green" | "amber" | "red" | "blue";
}

export function MetricProgressBar({
  label,
  value,
  icon: Icon,
  color = "blue",
}: MetricProgressBarProps) {
  const colorClasses = {
    green: {
      text: "text-green-400",
      bg: "bg-green-500/20",
      progress: "bg-green-500",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-500/20",
      progress: "bg-amber-500",
    },
    red: {
      text: "text-red-400",
      bg: "bg-red-500/20",
      progress: "bg-red-500",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/20",
      progress: "bg-blue-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colors.text}`} />
          <span className="text-sm text-zinc-300 font-medium">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {value}
        </span>
      </div>
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={`h-full ${colors.progress} rounded-full`}
        />
      </div>
    </div>
  );
}
