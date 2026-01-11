"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useMapStore } from "@/stores/map-store";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  MapPin,
} from "lucide-react";
import { MetricProgressBar } from "./metric-progress-bar";
import { FlawCard } from "./flaw-card";
import { SuggestionCard } from "./suggestion-card";
import type { SafetyAuditResult } from "@/types/safety-audit";
import {
  Signpost,
  Lightbulb,
  Navigation,
  Bike,
  User,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getClusterData,
  updateSafetyAudit,
  initializeClusterData,
  getImageAudit,
} from "@/lib/cluster-storage";

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getColorClasses = () => {
    if (score >= 70) {
      return {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/50",
      };
    }
    if (score >= 40) {
      return {
        bg: "bg-amber-500/20",
        text: "text-amber-400",
        border: "border-amber-500/50",
      };
    }
    return {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500/50",
    };
  };

  const colors = getColorClasses();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-lg border",
        colors.bg,
        colors.border
      )}
    >
      <span className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
        {label}
      </span>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("text-5xl font-bold", colors.text)}
      >
        {score}
      </motion.div>
      <span className="text-sm text-zinc-500 mt-1">/ 100</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="text-sm text-zinc-400">Generating safety audit...</p>
      <p className="text-xs text-zinc-500 text-center">
        Analyzing intersection infrastructure and safety metrics
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-red-400">
          Failed to generate audit
        </p>
        <p className="text-xs text-zinc-500">
          Unable to analyze intersection. Please try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
        <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        </div>
      </div>
      <div className="text-center space-y-3 max-w-sm">
        <h3 className="text-lg font-semibold text-white">
          No Intersection Selected
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Click on a cluster on the map to view a detailed safety audit for that
          intersection.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <p className="text-xs text-zinc-500">
            Select a cluster to get started
          </p>
        </div>
      </div>
    </div>
  );
}

interface SafetyAuditSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SafetyAuditSidebar({
  isOpen = false,
  onClose,
}: SafetyAuditSidebarProps) {
  const {
    selectedHotspot,
    safetyAudit,
    isGeneratingAudit,
    setSafetyAudit,
    setIsGeneratingAudit,
  } = useMapStore();
  const [error, setError] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  // Ref to store the AbortController for the current request
  const abortControllerRef = useRef<AbortController | null>(null);

  // Watch for current image changes in cluster data
  useEffect(() => {
    if (!selectedHotspot) {
      setCurrentImageUrl(null);
      return;
    }

    const checkImage = () => {
      const storedData = getClusterData(selectedHotspot.id);
      const imageUrl = storedData?.images.current || null;
      setCurrentImageUrl(imageUrl);
    };

    // Check immediately
    checkImage();

    // Poll for changes every 500ms
    const interval = setInterval(checkImage, 500);
    return () => clearInterval(interval);
  }, [selectedHotspot]);

  // Load existing audit from state store and auto-generate if needed
  useEffect(() => {
    // Cancel any ongoing request when selectedHotspot or currentImageUrl changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGeneratingAudit(false);
    }

    if (!selectedHotspot) {
      setSafetyAudit(null);
      setError(null);
      setIsGeneratingAudit(false);
      return;
    }

    // Initialize cluster data in store
    initializeClusterData(selectedHotspot.id, selectedHotspot);

    const storedData = getClusterData(selectedHotspot.id);
    
    // Try to load existing audit for the current image
    const imageAudit = currentImageUrl ? getImageAudit(selectedHotspot.id, currentImageUrl) : null;
    
    if (imageAudit) {
      setSafetyAudit(imageAudit);
      return; // Don't generate if we have stored audit for this image
    }

    // If no current image or it's the original, try to load the main audit
    if (!currentImageUrl || currentImageUrl === storedData?.images.original) {
      if (storedData?.safetyAudit) {
        setSafetyAudit(storedData.safetyAudit);
        return; // Don't generate if we have stored data
      }
    }

    // Create a new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const generateAudit = async () => {
      try {
        setError(null);
        setIsGeneratingAudit(true);

        // If we have a current image URL, use it for single image audit
        // Otherwise, generate panoramic audit from street view
        const requestBody: any = {
          clusterData: {
            address: selectedHotspot.address,
            total_count: selectedHotspot.total_count,
            fatal_count: selectedHotspot.fatal_count,
            cyclist_count: selectedHotspot.cyclist_count,
            pedestrian_count: selectedHotspot.pedestrian_count,
          },
        };

        if (currentImageUrl && currentImageUrl !== storedData?.images.original) {
          // Single image audit
          requestBody.imageUrl = currentImageUrl;
        } else {
          // Panoramic audit from street view
          requestBody.lat = selectedHotspot.centroid.lat;
          requestBody.lng = selectedHotspot.centroid.lng;
        }

        const response = await fetch("/api/safety-audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate audit");
        }

        const auditData: SafetyAuditResult = await response.json();

        // Only update state if the request wasn't aborted
        if (!abortController.signal.aborted) {
          setSafetyAudit(auditData);
          // Save audit to local storage (with imageUrl if it's a single image audit)
          if (currentImageUrl && currentImageUrl !== storedData?.images.original) {
            updateSafetyAudit(selectedHotspot.id, auditData, selectedHotspot, currentImageUrl);
          } else {
            updateSafetyAudit(selectedHotspot.id, auditData, selectedHotspot);
          }
        }
      } catch (err) {
        // Don't set error if the request was aborted (user clicked another cluster)
        if (err instanceof Error && err.name === "AbortError") {
          console.log("Safety audit request cancelled");
          return;
        }
        // Only update error state if request wasn't aborted
        if (!abortController.signal.aborted) {
          console.error("Error generating safety audit:", err);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsGeneratingAudit(false);
        }
        // Clear the ref if this was the current request
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    generateAudit();

    // Cleanup function to cancel the request if component unmounts or hotspot changes
    return () => {
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
        setIsGeneratingAudit(false);
      }
    };
  }, [
    selectedHotspot,
    currentImageUrl,
    isGeneratingAudit,
    safetyAudit,
    setSafetyAudit,
    setIsGeneratingAudit,
  ]);

  const showContent = safetyAudit && !isGeneratingAudit && !error;
  const showEmptyState = !selectedHotspot && !isGeneratingAudit && !error;

  const handleRetry = () => {
    setError(null);
    setSafetyAudit(null);
    setIsGeneratingAudit(false);
    // Trigger regeneration by clearing state
  };

  // Get original audit for comparison
  const originalAudit = selectedHotspot
    ? getClusterData(selectedHotspot.id)?.safetyAudit || null
    : null;

  // Calculate safety score (average of all metrics, floored)
  const safetyScore = safetyAudit?.metrics
    ? Math.floor(
        (safetyAudit.metrics.signage +
          safetyAudit.metrics.lighting +
          safetyAudit.metrics.crosswalkVisibility +
          safetyAudit.metrics.bikeInfrastructure +
          safetyAudit.metrics.pedestrianInfrastructure +
          safetyAudit.metrics.trafficCalming) /
          6
      )
    : 0;

  // Calculate previous safety score for delta
  const previousSafetyScore = originalAudit?.metrics
    ? Math.floor(
        (originalAudit.metrics.signage +
          originalAudit.metrics.lighting +
          originalAudit.metrics.crosswalkVisibility +
          originalAudit.metrics.bikeInfrastructure +
          originalAudit.metrics.pedestrianInfrastructure +
          originalAudit.metrics.trafficCalming) /
          6
      )
    : undefined;

  const metrics = safetyAudit?.metrics
    ? [
        {
          label: "Walkability",
          value: safetyAudit.walkabilityScore,
          previousValue: originalAudit?.walkabilityScore,
          icon: User,
          color: "blue" as const,
        },
        {
          label: "Signage",
          value: safetyAudit.metrics.signage,
          previousValue: originalAudit?.metrics.signage,
          icon: Signpost,
          color: "red" as const,
        },
        {
          label: "Lighting",
          value: safetyAudit.metrics.lighting,
          previousValue: originalAudit?.metrics.lighting,
          icon: Lightbulb,
          color: "amber" as const,
        },
        {
          label: "Crosswalks",
          value: safetyAudit.metrics.crosswalkVisibility,
          previousValue: originalAudit?.metrics.crosswalkVisibility,
          icon: Navigation,
          color: "green" as const,
        },
        {
          label: "Bike Infrastructure",
          value: safetyAudit.metrics.bikeInfrastructure,
          previousValue: originalAudit?.metrics.bikeInfrastructure,
          icon: Bike,
          color: "blue" as const,
        },
        {
          label: "Pedestrian Infrastructure",
          value: safetyAudit.metrics.pedestrianInfrastructure,
          previousValue: originalAudit?.metrics.pedestrianInfrastructure,
          icon: User,
          color: "amber" as const,
        },
        {
          label: "Traffic Calming",
          value: safetyAudit.metrics.trafficCalming,
          previousValue: originalAudit?.metrics.trafficCalming,
          icon: Gauge,
          color: "green" as const,
        },
      ]
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
          }}
          className="fixed left-16 top-0 z-50 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Safety Audit</h2>
              <p className="text-xs text-zinc-400">
                {selectedHotspot?.intersection ||
                  selectedHotspot?.address ||
                  "Select an intersection"}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-zinc-800 transition-colors flex items-center"
                title="Close"
              >
                <ChevronLeft className="h-5 w-5 text-zinc-400" />
                <ChevronLeft className="h-5 w-5 text-zinc-400 -ml-2" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {showEmptyState && <EmptyState />}
            {isGeneratingAudit && !error && <LoadingState />}
            {error && !isGeneratingAudit && (
              <ErrorState onRetry={handleRetry} />
            )}
            {showContent && safetyAudit && (
              <>
                {/* Safety Score */}
                <div className="relative">
                  <ScoreBadge score={safetyScore} label="Safety Score" />
                  {previousSafetyScore !== undefined && previousSafetyScore !== safetyScore && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
                      <span
                        className={`text-xs font-semibold ${
                          safetyScore > previousSafetyScore
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {safetyScore > previousSafetyScore ? "+" : ""}
                        {safetyScore - previousSafetyScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                    Safety Metrics
                  </h3>
                  <div className="space-y-3">
                    {metrics.map((metric) => (
                      <MetricProgressBar
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        previousValue={metric.previousValue}
                        icon={metric.icon}
                        color={metric.color}
                      />
                    ))}
                  </div>
                </div>

                {/* Safety Flaws */}
                {safetyAudit.flaws.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                      Safety Issues
                    </h3>
                    <div className="space-y-3">
                      {safetyAudit.flaws.map((flaw, index) => (
                        <FlawCard key={index} flaw={flaw} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {safetyAudit.suggestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                      Improvement Suggestions
                    </h3>
                    <div className="space-y-3">
                      {safetyAudit.suggestions.map((suggestion, index) => (
                        <SuggestionCard
                          key={index}
                          suggestion={suggestion}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Infrastructure Gaps */}
                {safetyAudit.infrastructureGaps.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                      Missing Infrastructure
                    </h3>
                    <div className="space-y-2">
                      {safetyAudit.infrastructureGaps.map((gap, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <p className="text-sm text-zinc-300">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
