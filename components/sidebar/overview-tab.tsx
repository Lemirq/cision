"use client";

import { StreetViewPanel } from "./street-view-panel";
import { StatsGrid } from "./stats-grid";
import type { ClusteredHotspot } from "@/types/collision";
import { MapPin, ChevronRight } from "lucide-react";

interface OverviewTabProps {
  hotspot: ClusteredHotspot;
}

export function OverviewTab({ hotspot }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-zinc-500 mt-1" />
        <div>
          <p className="text-white font-medium">{hotspot.address}</p>
          <p className="text-sm text-zinc-500">Intersection location</p>
        </div>
      </div>

      <StreetViewPanel
        lat={hotspot.centroid.lat}
        lng={hotspot.centroid.lng}
      />

      <StatsGrid hotspot={hotspot} />

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div>
          <p className="text-sm text-zinc-400">Severity Score</p>
          <p className="text-lg font-bold text-white">{hotspot.severity_score}/100</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            hotspot.severity_score >= 80
              ? "bg-red-500/20 text-red-400"
              : hotspot.severity_score >= 60
              ? "bg-amber-500/20 text-amber-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {hotspot.severity_score >= 80 ? "Critical" : hotspot.severity_score >= 60 ? "High" : "Moderate"}
        </div>
      </div>

      <div className="pt-2">
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
          <span className="text-white font-medium">Generate Safety Audit</span>
          <ChevronRight className="h-4 w-4 text-white/80" />
        </button>
      </div>
    </div>
  );
}
