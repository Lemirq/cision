"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ClusteredHotspot } from "@/types/collision";
import { ChevronLeft, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

type LeaderboardMetric = "total" | "fatal" | "cyclist" | "pedestrian";

interface LeaderboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  hotspots?: ClusteredHotspot[];
}

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  total: "Total Collisions",
  fatal: "Fatal Collisions",
  cyclist: "Cyclist Collisions",
  pedestrian: "Pedestrian Collisions",
};

export function LeaderboardSidebar({
  isOpen = false,
  onClose,
  hotspots,
}: LeaderboardSidebarProps) {
  const [metric, setMetric] = useState<LeaderboardMetric>("total");
  const [fetched, setFetched] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      centroid: { lat: number; lng: number };
      total_count: number;
      fatal_count: number;
      cyclist_count: number;
      pedestrian_count: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const useExternal = Array.isArray(hotspots) && hotspots.length > 0;
  const { selectHotspot, flyTo } = useMapStore();

  // Reset to first page when metric or open-state changes
  useEffect(() => {
    setPage(1);
  }, [metric, isOpen]);

  // When using external hotspots array, compute total pages and clamp page
  useEffect(() => {
    if (!(useExternal && hotspots)) return;
    const filtered = hotspots.filter((h) => {
      const name = (h.intersection || h.address || "").trim().toLowerCase();
      const nearZero =
        Math.abs(h.centroid.lat) < 1e-9 && Math.abs(h.centroid.lng) < 1e-9;
      return name !== "nsa" && !nearZero;
    });
    const total = Math.max(1, Math.ceil(filtered.length / pageSize));
    setTotalPages(total);
    setPage((p) => Math.min(p, total));
  }, [useExternal, hotspots]);

  useEffect(() => {
    if (useExternal || !isOpen) return;
    let aborted = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/leaderboard?metric=${metric}&page=${page}&pageSize=${pageSize}`, {
          cache: "force-cache",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (aborted) return;
        setFetched(data.rows || []);
        setTotalPages(data.totalPages || 1);
      } catch (e) {
        if (!aborted) setError("Failed to load leaderboard");
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [metric, isOpen, useExternal, page]);

  const sorted = useMemo(() => {
    const keyMap: Record<LeaderboardMetric, (h: ClusteredHotspot) => number> = {
      total: (h) => h.total_count,
      fatal: (h) => h.fatal_count,
      cyclist: (h) => h.cyclist_count,
      pedestrian: (h) => h.pedestrian_count,
    };
    const toValue = keyMap[metric];
    if (useExternal && hotspots) {
      // Filter NSA-like entries and paginate
      const filtered = hotspots.filter((h) => {
        const name = (h.intersection || h.address || "").trim().toLowerCase();
        const nearZero =
          Math.abs(h.centroid.lat) < 1e-9 && Math.abs(h.centroid.lng) < 1e-9;
        return name !== "nsa" && !nearZero;
      });
      const sortedAll = [...filtered].sort((a, b) => toValue(b) - toValue(a));
      const start = (page - 1) * pageSize;
      return sortedAll.slice(start, start + pageSize);
    }
    // When using API rows, map to a minimal compatible shape
    return fetched
      .map((r) => ({
        id: r.id,
        centroid: r.centroid,
        collisions: [],
        severity_score: 0,
        total_count: r.total_count,
        fatal_count: r.fatal_count,
        cyclist_count: r.cyclist_count,
        pedestrian_count: r.pedestrian_count,
        address: r.address,
        intersection: r.name,
      })) as unknown as ClusteredHotspot[];
  }, [hotspots, fetched, metric, useExternal, page]);

  const getValue = (h: ClusteredHotspot) => {
    switch (metric) {
      case "fatal":
        return h.fatal_count;
      case "cyclist":
        return h.cyclist_count;
      case "pedestrian":
        return h.pedestrian_count;
      default:
        return h.total_count;
    }
  };

  const maxValue = useMemo(() => {
    return sorted.length > 0 ? Math.max(...sorted.map(getValue)) : 0;
  }, [sorted]);

  const baseIndex = (page - 1) * pageSize;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed left-16 top-0 z-50 h-screen w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
                <p className="text-xs text-zinc-400">{METRIC_LABELS[metric]}</p>
              </div>
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

          {/* Metric selector */}
          <div className="border-b border-zinc-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["total", "Total"] as const,
                  ["fatal", "Fatal"] as const,
                  ["cyclist", "Cyclists"] as const,
                  ["pedestrian", "Pedestrians"] as const,
                ] satisfies Array<[LeaderboardMetric, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm border transition-colors",
                    metric === key
                      ? "bg-zinc-800 border-zinc-700 text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!useExternal && loading && (
              <p className="text-sm text-zinc-500 p-2">Loading…</p>
            )}
            {!useExternal && error && (
              <p className="text-sm text-red-400 p-2">{error}</p>
            )}
            {sorted.map((h, idx) => {
              const value = getValue(h);
              const pct = maxValue > 0 ? Math.max(0.08, value / maxValue) : 0;
              return (
                <button
                  key={h.id}
                  className="relative w-full text-left rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800 transition-colors"
                  onClick={() => {
                    // Fly and select a lightweight hotspot
                    flyTo(h.centroid.lng, h.centroid.lat);
                    selectHotspot({
                      id: h.id,
                      centroid: h.centroid,
                      collisions: [],
                      severity_score: h.severity_score || 0,
                      total_count: h.total_count,
                      fatal_count: h.fatal_count,
                      cyclist_count: h.cyclist_count,
                      pedestrian_count: h.pedestrian_count,
                      address: h.address,
                      intersection: h.intersection,
                    });
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-lg bg-amber-500/15"
                    style={{ width: `${pct * 100}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center">
                        {baseIndex + idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {h.intersection || h.address}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {h.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-amber-300 tabular-nums">
                      {value}
                    </div>
                  </div>
                </button>
              );
            })}

            {sorted.length === 0 && (
              <p className="text-sm text-zinc-500 p-2">No data available.</p>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-zinc-800 p-3 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={cn(
                "px-3 py-2 rounded-md text-sm border transition-colors",
                page <= 1
                  ? "bg-zinc-900 border-zinc-900 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800",
              )}
            >
              Prev
            </button>
            <span className="text-xs text-zinc-400">
              Page {page} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.max(1, totalPages), p + 1))}
              disabled={page >= totalPages}
              className={cn(
                "px-3 py-2 rounded-md text-sm border transition-colors",
                page >= totalPages
                  ? "bg-zinc-900 border-zinc-900 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800",
              )}
            >
              Next
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


