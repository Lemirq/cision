"use client";

import { useEffect, useRef } from "react";
import Map, { NavigationControl, Source, Layer, MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import { useMapStore } from "@/stores/map-store";
import type { ClusteredHotspot } from "@/types/collision";
import { MAP_CONFIG } from "@/lib/constants";

interface CityMapProps {
  hotspots: ClusteredHotspot[];
}

export function CityMap({ hotspots }: CityMapProps) {
  const { viewport, setViewport, selectHotspot, selectedHotspot, highlightedRoad } = useMapStore();
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

  useEffect(() => {
    if (selectedHotspot) {
      mapRef.current?.flyTo({
        center: [selectedHotspot.centroid.lng, selectedHotspot.centroid.lat],
        zoom: MAP_CONFIG.HOTSPOT_ZOOM,
        pitch: 60,
        duration: 2000,
        essential: true,
      });
    }
  }, [selectedHotspot]);

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
        intersection: hotspot.intersection,
        address: hotspot.address,
      },
    })),
  };

  // Filter hotspots on highlighted road
  const highlightedHotspots = highlightedRoad
    ? hotspots.filter((hotspot) =>
        hotspot.intersection.toLowerCase().includes(highlightedRoad.toLowerCase())
      )
    : [];

  const highlightedGeojson = {
    type: "FeatureCollection" as const,
    features: highlightedHotspots.map((hotspot) => ({
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

  const handleMapClick = (event: MapMouseEvent) => {
    if (!event.features || event.features.length === 0) return;
    
    const feature = event.features[0];
    const hotspotId = feature.properties?.id;
    
    if (hotspotId) {
      const hotspot = hotspots.find((h) => h.id === hotspotId);
      if (hotspot) {
        selectHotspot(hotspot);
      }
    }
  };

  return (
    <Map
      ref={mapRef}
      {...viewport}
      onMove={(evt) => setViewport(evt.viewState)}
      onClick={handleMapClick}
      interactiveLayerIds={["hotspot-circles"]}
      mapStyle={MAP_CONFIG.MAPBOX_STYLE}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: "100%", height: "100%" }}
      antialias={true}
    >
      <NavigationControl position="bottom-right" />

      <Layer
        id="3d-buildings"
        source="composite"
        source-layer="building"
        filter={["==", "extrude", "true"]}
        type="fill-extrusion"
        minzoom={14}
        paint={{
          "fill-extrusion-color": "#27272a",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.8,
        }}
      />
      
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
            "circle-opacity": highlightedRoad ? 0.3 : 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>

      {highlightedRoad && highlightedHotspots.length > 0 && (
        <Source id="highlighted-hotspots" type="geojson" data={highlightedGeojson}>
          <Layer
            id="highlighted-circles"
            type="circle"
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "severity"],
                50, 12,
                100, 24,
              ],
              "circle-color": "#3b82f6",
              "circle-opacity": 0.9,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#60a5fa",
            }}
          />
        </Source>
      )}
    </Map>
  );
}
