"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, MapPin, Navigation } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import type { ClusteredHotspot } from "@/types/collision";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  hotspots: ClusteredHotspot[];
}

interface SearchResult {
  type: "intersection" | "road";
  id: string;
  label: string;
  intersection?: ClusteredHotspot;
  roadName?: string;
}

export function SearchBar({ hotspots }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectHotspot, highlightRoad, flyTo } = useMapStore();

  // Extract unique road names from intersections
  const roadNames = useMemo(() => {
    const roads = new Set<string>();
    hotspots.forEach((hotspot) => {
      const parts = hotspot.intersection.split(" & ");
      parts.forEach((part) => {
        const roadName = part.trim();
        if (roadName) {
          roads.add(roadName);
        }
      });
    });
    return Array.from(roads).sort();
  }, [hotspots]);

  // Search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search intersections
    hotspots.forEach((hotspot) => {
      const intersectionLower = hotspot.intersection.toLowerCase();
      const addressLower = hotspot.address.toLowerCase();

      if (
        intersectionLower.includes(lowerQuery) ||
        addressLower.includes(lowerQuery)
      ) {
        searchResults.push({
          type: "intersection",
          id: hotspot.id,
          label: hotspot.intersection,
          intersection: hotspot,
        });
      }
    });

    // Search roads
    roadNames.forEach((roadName) => {
      if (roadName.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: "road",
          id: `road-${roadName}`,
          label: roadName,
          roadName,
        });
      }
    });

    // Sort: exact matches first, then by type (intersections before roads)
    return searchResults.sort((a, b) => {
      const aExact = a.label.toLowerCase() === lowerQuery;
      const bExact = b.label.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (a.type !== b.type) {
        return a.type === "intersection" ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  }, [query, hotspots, roadNames]);

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === "intersection" && result.intersection) {
      highlightRoad(null); // Clear road highlight when selecting intersection
      selectHotspot(result.intersection);
      flyTo(
        result.intersection.centroid.lng,
        result.intersection.centroid.lat
      );
      setQuery("");
      setIsOpen(false);
    } else if (result.type === "road" && result.roadName) {
      selectHotspot(null); // Clear intersection selection when selecting road
      highlightRoad(result.roadName);
      // Find all intersections on this road and fly to the first one
      const roadIntersections = hotspots.filter((hotspot) =>
        hotspot.intersection.toLowerCase().includes(result.roadName!.toLowerCase())
      );
      if (roadIntersections.length > 0) {
        const firstIntersection = roadIntersections[0];
        flyTo(firstIntersection.centroid.lng, firstIntersection.centroid.lat);
      }
      setQuery("");
      setIsOpen(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      highlightRoad(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [results.length]);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search intersections or roads..."
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              highlightRoad(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  index === focusedIndex
                    ? "bg-zinc-800"
                    : "bg-transparent hover:bg-zinc-800/50"
                }`}
              >
                {result.type === "intersection" ? (
                  <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                ) : (
                  <Navigation className="h-4 w-4 text-green-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {result.label}
                  </div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    {result.type === "intersection"
                      ? "Intersection"
                      : "Road"}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
