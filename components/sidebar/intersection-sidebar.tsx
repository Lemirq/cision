"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapStore } from "@/stores/map-store";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { PhotoProvider } from "react-photo-view";

export function IntersectionSidebar() {
  const { selectedHotspot, selectHotspot } = useMapStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [direction, setDirection] = useState(1);

  // Tab order for directional animations
  const tabOrder = ["overview", "audit", "reimagine"];

  // Reset to overview tab when hotspot changes
  useEffect(() => {
    if (selectedHotspot) {
      setActiveTab("overview");
      setDirection(1);
    }
  }, [selectedHotspot?.id]);

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    const newDirection = newIndex > currentIndex ? 1 : -1;
    setDirection(newDirection);
    setActiveTab(newTab);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait">
      {selectedHotspot && (
        <motion.aside
          key={selectedHotspot.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1
          }}
          exit={{
            x: "100%",
            opacity: 0
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200
          }}
          className="fixed right-0 top-0 z-50 h-screen w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col"
        >
          <motion.div
            key={selectedHotspot.id}
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

            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <PhotoProvider>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                    <AnimatePresence mode="wait" custom={direction}>
                      {activeTab === "overview" && (
                        <motion.div
                          key="overview"
                          custom={direction}
                          variants={variants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            duration: 0.25,
                            ease: [0.25, 0.1, 0.25, 1],
                          }}
                          style={{ willChange: "transform, opacity" }}
                        >
                          <OverviewTab hotspot={selectedHotspot} />
                        </motion.div>
                      )}

                      {activeTab === "audit" && (
                        <motion.div
                          key="audit"
                          custom={direction}
                          variants={variants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            duration: 0.25,
                            ease: [0.25, 0.1, 0.25, 1],
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
                          custom={direction}
                          variants={variants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            duration: 0.25,
                            ease: [0.25, 0.1, 0.25, 1],
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
