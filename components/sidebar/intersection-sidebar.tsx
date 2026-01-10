"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapStore } from "@/stores/map-store";
import { X, Map as MapIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { PhotoProvider } from "react-photo-view";

export function IntersectionSidebar() {
  const { selectedHotspot, selectHotspot } = useMapStore();
  const [activeTab, setActiveTab] = useState("overview");

  // Reset to overview tab when hotspot changes
  useEffect(() => {
    if (selectedHotspot) {
      setActiveTab("overview");
    }
  }, [selectedHotspot?.id]);

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200
      }}
      className="fixed right-0 top-0 z-50 h-screen w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {selectedHotspot ? (
          <motion.div
            key="hotspot-content"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedHotspot.intersection}
                </h2>
                <p className="text-sm text-zinc-400">
                  {selectedHotspot.total_count} collisions recorded
                </p>
              </div>
              <button
                onClick={() => selectHotspot(null)}
                className="rounded-lg p-2 hover:bg-zinc-800"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              <PhotoProvider>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
                    <TabsTrigger 
                      value="overview"
                      className="transition-all hover:scale-105 active:scale-95"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="audit"
                      className="transition-all hover:scale-105 active:scale-95"
                    >
                      Safety Audit
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reimagine"
                      className="transition-all hover:scale-105 active:scale-95"
                    >
                      Re-imagine
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative mt-4 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {activeTab === "overview" && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                          }}
                          style={{ willChange: "transform, opacity" }}
                        >
                          <OverviewTab hotspot={selectedHotspot} />
                        </motion.div>
                      )}

                      {activeTab === "audit" && (
                        <motion.div
                          key="audit"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                          }}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                          style={{ willChange: "transform, opacity" }}
                        >
                          <p className="text-sm text-zinc-400">
                            Generate a safety audit to see AI analysis
                          </p>
                        </motion.div>
                      )}

                      {activeTab === "reimagine" && (
                        <motion.div
                          key="reimagine"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                          }}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                          style={{ willChange: "transform, opacity" }}
                        >
                          <p className="text-sm text-zinc-400">
                            Re-imagine this intersection with AI
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Tabs>
              </PhotoProvider>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder-content"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            className="flex flex-col items-center justify-center h-full text-center p-4"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <MapIcon className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Explore the Map</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Click on any hotspot marker to view collision data and generate safety insights.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
