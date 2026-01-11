"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import type { ClusteredHotspot } from "@/types/collision";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  hotspots: ClusteredHotspot[];
}

interface IntersectionResult {
  type: "intersection";
  id: string;
  label: string;
  subtitle?: string;
  intersection: ClusteredHotspot;
}

interface PlaceResult {
  type: "place";
  id: string;
  label: string;
  subtitle: string;
  placeId: string;
}

type SearchResult = IntersectionResult | PlaceResult;

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export function SearchBar({ hotspots }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlacePrediction[]>(
    [],
  );
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { selectHotspot, flyTo } = useMapStore();

  // Search intersections from local data
  const intersectionResults = useMemo<IntersectionResult[]>(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const searchResults: IntersectionResult[] = [];

    // Search intersections
    hotspots.forEach((hotspot) => {
      const intersectionLower = hotspot.intersection.toLowerCase();
      const addressLower = (hotspot.address || "").toLowerCase();

      if (
        intersectionLower.includes(lowerQuery) ||
        addressLower.includes(lowerQuery)
      ) {
        searchResults.push({
          type: "intersection",
          id: hotspot.id,
          label: hotspot.intersection,
          subtitle: hotspot.address,
          intersection: hotspot,
        });
      }
    });

    // Sort: exact matches first
    return searchResults.sort((a, b) => {
      const aExact = a.label.toLowerCase() === lowerQuery;
      const bExact = b.label.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [query, hotspots]);

  // Fetch Google Places suggestions
  const fetchPlaceSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.trim().length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    setIsLoadingPlaces(true);
    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      const data = await response.json();
      setPlaceSuggestions(data.predictions || []);
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      setPlaceSuggestions([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, []);

  // Debounced place search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchPlaceSuggestions(query);
      }, 300);
    } else {
      setPlaceSuggestions([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchPlaceSuggestions]);

  // Combine results: intersections first, then places
  const results = useMemo<SearchResult[]>(() => {
    const combined: SearchResult[] = [...intersectionResults];

    // Add Google Places suggestions
    placeSuggestions.forEach((prediction) => {
      combined.push({
        type: "place",
        id: `place-${prediction.placeId}`,
        label: prediction.mainText,
        subtitle: prediction.secondaryText,
        placeId: prediction.placeId,
      });
    });

    return combined;
  }, [intersectionResults, placeSuggestions]);

  // Handle selection
  const handleSelect = async (result: SearchResult) => {
    if (result.type === "intersection") {
      selectHotspot(result.intersection);
      flyTo(result.intersection.centroid.lng, result.intersection.centroid.lat);
    } else if (result.type === "place") {
      // Fetch place details and fly to location
      try {
        setIsLoadingPlaces(true);
        const response = await fetch(
          `/api/places/details?place_id=${encodeURIComponent(result.placeId)}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch place details");
        }
        const data = await response.json();

        // Fly to the location
        flyTo(data.location.lng, data.location.lat);
        // Clear selection since we don't have a hotspot for this place
        selectHotspot(null);
      } catch (error) {
        console.error("Error fetching place details:", error);
      } finally {
        setIsLoadingPlaces(false);
      }
    }

    setQuery("");
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (
      e.key === "Enter" &&
      focusedIndex >= 0 &&
      results[focusedIndex]
    ) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
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

  const showDropdown = isOpen && (results.length > 0 || isLoadingPlaces);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 pointer-events-none" />
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
          placeholder="Search intersections or addresses..."
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
        />
        {isLoadingPlaces && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
          </div>
        )}
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setPlaceSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {results.length === 0 && isLoadingPlaces ? (
              <div className="px-4 py-6 text-center text-zinc-400 text-sm">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : (
              <>
                {intersectionResults.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        Intersections
                      </span>
                    </div>
                    {intersectionResults.map((result, index) => {
                      const globalIndex = index;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            globalIndex === focusedIndex
                              ? "bg-zinc-800"
                              : "bg-transparent hover:bg-zinc-800/50"
                          }`}
                        >
                          <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {result.label}
                            </div>
                            {result.subtitle && (
                              <div className="text-zinc-400 text-xs mt-0.5 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
                {placeSuggestions.length > 0 && (
                  <>
                    {intersectionResults.length > 0 && (
                      <div className="h-px bg-zinc-800" />
                    )}
                    <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
                      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        Google Places
                      </span>
                    </div>
                    {placeSuggestions.map((prediction, index) => {
                      const result: PlaceResult = {
                        type: "place",
                        id: `place-${prediction.placeId}`,
                        label: prediction.mainText,
                        subtitle: prediction.secondaryText,
                        placeId: prediction.placeId,
                      };
                      const globalIndex = intersectionResults.length + index;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                            globalIndex === focusedIndex
                              ? "bg-zinc-800"
                              : "bg-transparent hover:bg-zinc-800/50"
                          }`}
                        >
                          <MapPin className="h-4 w-4 text-green-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {result.label}
                            </div>
                            {result.subtitle && (
                              <div className="text-zinc-400 text-xs mt-0.5 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
                {results.length === 0 &&
                  !isLoadingPlaces &&
                  query.trim().length >= 2 && (
                    <div className="px-4 py-6 text-center text-zinc-400 text-sm">
                      No results found
                    </div>
                  )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
