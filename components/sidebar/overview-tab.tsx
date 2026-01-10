"use client";

import { StreetViewPanel } from "./street-view-panel";
import { StatsGrid } from "./stats-grid";
import { SeverityProgressBar } from "./severity-progress-bar";
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

      <SeverityProgressBar score={hotspot.severity_score} />

      <div className="pt-2">
        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
          <span className="text-white font-medium">Generate Safety Audit</span>
          <ChevronRight className="h-4 w-4 text-white/80" />
        </button>
      </div>
    </div>
  );
}
