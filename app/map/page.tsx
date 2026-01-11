"use client";

import { useState } from "react";
import { CityMap } from "@/components/map/city-map";
import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { PersonaSidebar } from "@/components/sidebar/persona-sidebar";
import { IntersectionSidebar } from "@/components/sidebar/intersection-sidebar";
import { SafetyAuditSidebar } from "@/components/sidebar/safety-audit-sidebar";
import { SearchBar } from "@/components/search/search-bar";
import { DEMO_HOTSPOTS } from "@/data/demo-intersections";

export default function App() {
  const [isVoiceAgentsOpen, setIsVoiceAgentsOpen] = useState(false);
  const [isSafetyAuditOpen, setIsSafetyAuditOpen] = useState(false);

  const handleVoiceAgentsClick = () => {
    setIsVoiceAgentsOpen((prev) => !prev);
    // Close safety audit if opening voice agents
    if (!isVoiceAgentsOpen) {
      setIsSafetyAuditOpen(false);
    }
  };

  const handleSafetyAuditClick = () => {
    setIsSafetyAuditOpen((prev) => !prev);
    // Close voice agents if opening safety audit
    if (!isSafetyAuditOpen) {
      setIsVoiceAgentsOpen(false);
    }
  };

  // Calculate padding based on which sidebars are open
  const leftPadding = isVoiceAgentsOpen || isSafetyAuditOpen ? "pl-[20rem]" : "pl-16";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <LeftSidebar
        onVoiceAgentsClick={handleVoiceAgentsClick}
        onSafetyAuditClick={handleSafetyAuditClick}
        isVoiceAgentsOpen={isVoiceAgentsOpen}
        isSafetyAuditOpen={isSafetyAuditOpen}
      />
      <PersonaSidebar
        isOpen={isVoiceAgentsOpen}
        onClose={() => setIsVoiceAgentsOpen(false)}
      />
      <SafetyAuditSidebar
        isOpen={isSafetyAuditOpen}
        onClose={() => setIsSafetyAuditOpen(false)}
      />
      <div className={`${leftPadding} h-full relative`}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <SearchBar hotspots={DEMO_HOTSPOTS} />
        </div>
        <CityMap hotspots={DEMO_HOTSPOTS} />
      </div>
      <IntersectionSidebar />
    </main>
  );
}
