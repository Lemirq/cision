"use client";

import { AlertTriangle, Bike, Users, Skull } from "lucide-react";
import type { ClusteredHotspot } from "@/types/collision";

interface StatsGridProps {
  hotspot: ClusteredHotspot;
}

export function StatsGrid({ hotspot }: StatsGridProps) {
  const stats = [
    {
      label: "Total Collisions",
      value: hotspot.total_count,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Fatal",
      value: hotspot.fatal_count,
      icon: Skull,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      label: "Cyclists",
      value: hotspot.cyclist_count,
      icon: Bike,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Pedestrians",
      value: hotspot.pedestrian_count,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3 rounded-lg border border-zinc-800 ${stat.bgColor} p-3`}
        >
          <stat.icon className={`h-5 w-5 ${stat.color}`} />
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
