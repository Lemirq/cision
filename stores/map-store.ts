import { create } from "zustand";
import type { ClusteredHotspot, CollisionPoint, PlaceInfo } from "@/types/collision";
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
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setViewport: (viewport: Partial<MapState["viewport"]>) => void;
  selectHotspot: (hotspot: ClusteredHotspot | null) => void;
  selectCollision: (collision: CollisionPoint | null) => void;
  setPlaceInfo: (placeInfo: PlaceInfo | null) => void;
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
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),
  selectHotspot: (hotspot) =>
    set({ selectedHotspot: hotspot, selectedCollision: null, sidebarOpen: hotspot !== null }),
  selectCollision: (collision) =>
    set({ selectedCollision: collision, selectedHotspot: null, sidebarOpen: collision !== null }),
  setPlaceInfo: (placeInfo) => set({ placeInfo }),
  flyTo: (lng, lat, zoom = MAP_CONFIG.HOTSPOT_ZOOM) =>
    set((state) => ({
      viewport: { ...state.viewport, longitude: lng, latitude: lat, zoom },
    })),
}));
