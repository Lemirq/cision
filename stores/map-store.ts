import { create } from "zustand";
import type { ClusteredHotspot, CollisionPoint, PlaceInfo } from "@/types/collision";
import type { SafetyAuditResult } from "@/types/safety-audit";
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
  selectedCollision: CollisionPoint | null;
  placeInfo: PlaceInfo | null;
  sidebarOpen: boolean;
  safetyAudit: SafetyAuditResult | null;
  isGeneratingAudit: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setViewport: (viewport: Partial<MapState["viewport"]>) => void;
  selectHotspot: (hotspot: ClusteredHotspot | null) => void;
  selectCollision: (collision: CollisionPoint | null) => void;
  setPlaceInfo: (placeInfo: PlaceInfo | null) => void;
  setSafetyAudit: (audit: SafetyAuditResult | null) => void;
  setIsGeneratingAudit: (isGenerating: boolean) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
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
  selectedCollision: null,
  placeInfo: null,
  sidebarOpen: false,
  safetyAudit: null,
  isGeneratingAudit: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),
  selectHotspot: (hotspot) =>
    set({ 
      selectedHotspot: hotspot, 
      selectedCollision: null, 
      sidebarOpen: hotspot !== null,
      safetyAudit: null, // Reset audit when selecting new hotspot
    }),
  selectCollision: (collision) =>
    set({ selectedCollision: collision, selectedHotspot: null, sidebarOpen: collision !== null }),
  setPlaceInfo: (placeInfo) => set({ placeInfo }),
  setSafetyAudit: (audit) => set({ safetyAudit: audit }),
  setIsGeneratingAudit: (isGenerating) => set({ isGeneratingAudit: isGenerating }),
  flyTo: (lng, lat, zoom = MAP_CONFIG.HOTSPOT_ZOOM) =>
    set((state) => ({
      viewport: { ...state.viewport, longitude: lng, latitude: lat, zoom },
    })),
}));
