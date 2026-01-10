"use client";

import { motion } from "framer-motion";
import { useMapStore } from "@/stores/map-store";
import { X, Map as MapIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { PhotoProvider } from "react-photo-view";

export function IntersectionSidebar() {
  const { selectedHotspot, selectHotspot } = useMapStore();

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 z-50 h-screen w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {selectedHotspot?.intersection || "Select a Hotspot"}
          </h2>
          <p className="text-sm text-zinc-400">
            {selectedHotspot ? `${selectedHotspot.total_count} collisions recorded` : "Click a marker on the map"}
          </p>
        </div>
        {selectedHotspot && (
          <button
            onClick={() => selectHotspot(null)}
            className="rounded-lg p-2 hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <PhotoProvider>
          {selectedHotspot ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="audit">Safety Audit</TabsTrigger>
                <TabsTrigger value="reimagine">Re-imagine</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <OverviewTab hotspot={selectedHotspot} />
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-sm text-zinc-400">
                    Generate a safety audit to see AI analysis
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="reimagine" className="mt-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-sm text-zinc-400">
                    Re-imagine this intersection with AI
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <MapIcon className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Explore the Map</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Click on any hotspot marker to view collision data and generate safety insights.
              </p>
            </div>
          )}
        </PhotoProvider>
      </div>
    </motion.aside>
  );
}
