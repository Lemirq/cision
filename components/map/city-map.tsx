"use client";

import { useEffect, useRef } from "react";
import Map, { NavigationControl, Source, Layer, Marker, MapRef } from "react-map-gl/mapbox";
import { useMapStore } from "@/stores/map-store";
import type { ClusteredHotspot } from "@/types/collision";
import { MAP_CONFIG } from "@/lib/constants";

interface CityMapProps {
  hotspots: ClusteredHotspot[];
}

export function CityMap({ hotspots }: CityMapProps) {
  const { viewport, setViewport, selectHotspot } = useMapStore();
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    // Initial animation sequence
    const timer = setTimeout(() => {
      mapRef.current?.flyTo({
        center: MAP_CONFIG.TORONTO_CENTER,
        zoom: MAP_CONFIG.INITIAL_ZOOM,
        duration: 3000,
        essential: true, // This animation is considered essential with respect to prefers-reduced-motion
      });
    }, 1000); // Small delay to ensure map is loaded/rendered

    return () => clearTimeout(timer);
  }, []);

  const geojson = {
    type: "FeatureCollection" as const,
    features: hotspots.map((hotspot) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [hotspot.centroid.lng, hotspot.centroid.lat] as [number, number],
      },
      properties: {
        id: hotspot.id,
        severity: hotspot.severity_score,
      },
    })),
  };

  return (
    <Map
      ref={mapRef}
      {...viewport}
      onMove={(evt) => setViewport(evt.viewState)}
      mapStyle={MAP_CONFIG.MAPBOX_STYLE}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: "100%", height: "100%" }}
      antialias={true}
    >
      <NavigationControl position="bottom-right" />
      
      <Source id="hotspots" type="geojson" data={geojson}>
        <Layer
          id="hotspot-circles"
          type="circle"
          paint={{
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "severity"],
              50, 10,
              100, 20,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "severity"],
              0, "#22c55e",
              50, "#f59e0b",
              80, "#ef4444",
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>

      {hotspots.map((hotspot) => (
        <Marker
          key={hotspot.id}
          longitude={hotspot.centroid.lng}
          latitude={hotspot.centroid.lat}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            selectHotspot(hotspot);
          }}
        />
      ))}
    </Map>
  );
}
