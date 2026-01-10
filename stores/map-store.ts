import { create } from "zustand";
import type { ClusteredHotspot } from "@/types/collision";
import { MAP_CONFIG } from "@/lib/constants";

interface MapState {
  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  selectedHotspot: ClusteredHotspot | null;
  sidebarOpen: boolean;
  highlightedRoad: string | null;
  setViewport: (viewport: Partial<MapState["viewport"]>) => void;
  selectHotspot: (hotspot: ClusteredHotspot | null) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  highlightRoad: (roadName: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    longitude: MAP_CONFIG.NORTH_AMERICA_CENTER[0],
    latitude: MAP_CONFIG.NORTH_AMERICA_CENTER[1],
    zoom: MAP_CONFIG.NORTH_AMERICA_ZOOM,
    pitch: 45,
    bearing: -17.6,
  },
  selectedHotspot: null,
  sidebarOpen: false,
  highlightedRoad: null,
  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),
  selectHotspot: (hotspot) =>
    set({ selectedHotspot: hotspot, sidebarOpen: hotspot !== null }),
  flyTo: (lng, lat, zoom = MAP_CONFIG.HOTSPOT_ZOOM) =>
    set((state) => ({
      viewport: { ...state.viewport, longitude: lng, latitude: lat, zoom },
    })),
  highlightRoad: (roadName) => set({ highlightedRoad: roadName }),
}));
