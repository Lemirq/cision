export const MAP_CONFIG = {
  TORONTO_CENTER: [-79.3832, 43.6532] as [number, number],
  INITIAL_ZOOM: 11,
  HOTSPOT_ZOOM: 16,
  MAPBOX_STYLE: "mapbox://styles/mapbox/dark-v11",
  NORTH_AMERICA_CENTER: [-98.5795, 39.8283] as [number, number],
  NORTH_AMERICA_ZOOM: 3,
};

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
