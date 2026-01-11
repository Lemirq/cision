"use client";

import { useState, useEffect } from "react";
import { CityMap } from "@/components/map/city-map";
import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { PersonaSidebar } from "@/components/sidebar/persona-sidebar";
import { IntersectionSidebar } from "@/components/sidebar/intersection-sidebar";
import { SafetyAuditSidebar } from "@/components/sidebar/safety-audit-sidebar";
import { LeaderboardSidebar } from "@/components/sidebar/leaderboard-sidebar";
import { SearchBar } from "@/components/search/search-bar";
import { DEMO_HOTSPOTS } from "@/data/demo-intersections";
import { useMapStore } from "@/stores/map-store";

export default function App() {
  const [isVoiceAgentsOpen, setIsVoiceAgentsOpen] = useState(false);
  const [isSafetyAuditOpen, setIsSafetyAuditOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [lastSelectedHotspotId, setLastSelectedHotspotId] = useState<string | null>(null);
  const selectedHotspot = useMapStore((state) => state.selectedHotspot);

  // Automatically open Safety Audit sidebar when a new hotspot is selected
  useEffect(() => {
    if (selectedHotspot) {
      const hotspotId = selectedHotspot.id;
      // Only auto-open if this is a different hotspot than the last one
      if (hotspotId !== lastSelectedHotspotId) {
        setIsSafetyAuditOpen(true);
        // Close voice agents when opening safety audit automatically
        setIsVoiceAgentsOpen(false);
        setIsLeaderboardOpen(false);
        setLastSelectedHotspotId(hotspotId);
      }
    } else {
      // Reset when no hotspot is selected
      setLastSelectedHotspotId(null);
    }
  }, [selectedHotspot, lastSelectedHotspotId]);

  const handleVoiceAgentsClick = () => {
    setIsVoiceAgentsOpen((prev) => !prev);
    // Close safety audit if opening voice agents
    if (!isVoiceAgentsOpen) {
      setIsSafetyAuditOpen(false);
      setIsLeaderboardOpen(false);
    }
  };

  const handleSafetyAuditClick = () => {
    setIsSafetyAuditOpen((prev) => !prev);
    // Close voice agents if opening safety audit
    if (!isSafetyAuditOpen) {
      setIsVoiceAgentsOpen(false);
      setIsLeaderboardOpen(false);
    }
  };

  const handleLeaderboardClick = () => {
    setIsLeaderboardOpen((prev) => !prev);
    if (!isLeaderboardOpen) {
      setIsVoiceAgentsOpen(false);
      setIsSafetyAuditOpen(false);
    }
  };

  // Calculate padding based on which sidebars are open
  const leftPadding =
    isVoiceAgentsOpen || isSafetyAuditOpen || isLeaderboardOpen ? "pl-[20rem]" : "pl-16";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <LeftSidebar
        onVoiceAgentsClick={handleVoiceAgentsClick}
        onSafetyAuditClick={handleSafetyAuditClick}
        onLeaderboardClick={handleLeaderboardClick}
        isVoiceAgentsOpen={isVoiceAgentsOpen}
        isSafetyAuditOpen={isSafetyAuditOpen}
        isLeaderboardOpen={isLeaderboardOpen}
      />
      <PersonaSidebar
        isOpen={isVoiceAgentsOpen}
        onClose={() => setIsVoiceAgentsOpen(false)}
      />
      <SafetyAuditSidebar
        isOpen={isSafetyAuditOpen}
        onClose={() => setIsSafetyAuditOpen(false)}
      />
      <LeaderboardSidebar
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
      <div className={`${leftPadding} h-full relative`}>
        <div className="absolute w-full top-4 left-1/2 -translate-x-1/2 z-10">
          <SearchBar hotspots={DEMO_HOTSPOTS} />
        </div>
        <CityMap hotspots={DEMO_HOTSPOTS} />
      </div>
      <IntersectionSidebar />
    </main>
  );
}
