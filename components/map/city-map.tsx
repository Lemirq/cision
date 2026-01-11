"use client";

import { useEffect, useRef, useState } from "react";
import Map, {
  NavigationControl,
  Source,
  Layer,
  MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import { useMapStore } from "@/stores/map-store";
import type {
  ClusteredHotspot,
  PlaceInfo,
} from "@/types/collision";
import { MAP_CONFIG } from "@/lib/constants";

interface CityMapProps {
  hotspots?: ClusteredHotspot[];
}

export function CityMap({ hotspots = [] }: CityMapProps) {
  const {
    viewport,
    setViewport,
    selectHotspot,
    selectCollision,
    setPlaceInfo,
    selectedHotspot,
    selectedCollision,
    setAllHotspots,
  } = useMapStore();
  const mapRef = useRef<MapRef>(null);
  const [clusteredHotspots, setClusteredHotspots] = useState<
    ClusteredHotspot[]
  >([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [showDebugView, _setShowDebugView] = useState(false); // Toggle for debug visualization

  // Convert clusters to GeoJSON format for heatmap
  const clustersToGeoJSON = (clusters: ClusteredHotspot[]) => {
    return {
      type: "FeatureCollection" as const,
      features: clusters.map((cluster) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [cluster.centroid.lng, cluster.centroid.lat] as [
            number,
            number,
          ],
        },
        properties: {
          id: cluster.id,
          weight: Math.min(cluster.total_count / 10, 3), // Normalize weight: 0-3 scale based on total_count
          total_count: cluster.total_count,
          severity_score: cluster.severity_score,
          fatal_count: cluster.fatal_count,
        },
      })),
    };
  };

  // Fetch clustered hotspots (used for both heatmap and cluster visualization)
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        setIsLoading(true);
        console.log("[CityMap] Fetching clusters from API...");
        const startTime = Date.now();

        const response = await fetch("/api/clusters");

        const fetchTime = Date.now() - startTime;
        console.log(
          `[CityMap] Clusters fetch completed in ${fetchTime}ms, status: ${response.status}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch clusters: ${response.status}`
          );
        }

        const clusters = await response.json();
        const parseTime = Date.now() - startTime;
        console.log(
          `[CityMap] Clusters parsed in ${parseTime}ms, received ${clusters.length} clusters`
        );

        setClusteredHotspots(clusters);
        // Store all hotspots in the map store for normalization
        setAllHotspots(clusters);

        // Debug: Log cluster data to verify collisions are included
        if (clusters.length > 0) {
          console.log("[CityMap] Clusters loaded:", clusters.length);
          console.log("[CityMap] First cluster sample:", {
            id: clusters[0].id,
            total_count: clusters[0].total_count,
            collisions_count: clusters[0].collisions?.length || 0,
            collisions: clusters[0].collisions?.slice(0, 3) || [],
          });
        }
      } catch (error) {
        console.error("[CityMap] Error fetching clusters:", error);
        if (error instanceof Error) {
          console.error("[CityMap] Error message:", error.message);
          console.error("[CityMap] Error stack:", error.stack);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusters();
  }, [setAllHotspots]);

  useEffect(() => {
    // Initial animation sequence
    const timer = setTimeout(() => {
      mapRef.current?.flyTo({
        center: MAP_CONFIG.TORONTO_CENTER,
        zoom: MAP_CONFIG.INITIAL_ZOOM,
        duration: 3000,
        essential: true,
      });
    }, 1000);

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
    } else if (selectedCollision) {
      mapRef.current?.flyTo({
        center: [selectedCollision.lng, selectedCollision.lat],
        zoom: 16,
        duration: 1500,
        essential: true,
      });
    }
  }, [selectedHotspot, selectedCollision]);

  // Handle clicks on heatmap/circle points
  const handleMapClick = async (event: MapMouseEvent) => {
    if (!event.features || event.features.length === 0) {
      // Clicked on empty space - clear selection
      selectCollision(null);
      selectHotspot(null);
      setPlaceInfo(null);
      return;
    }

    const feature = event.features[0];

    // Check if it's a clustered hotspot (priority - these represent problem areas)
    if (feature.source === "clusters") {
      const hotspotId = feature.properties?.id;
      if (hotspotId) {
        const hotspot = clusteredHotspots.find((h) => h.id === hotspotId);
        if (hotspot) {
          selectHotspot(hotspot);
          // Fetch place info for the cluster centroid
          try {
            const placeResponse = await fetch(
              `/api/places?lat=${hotspot.centroid.lat}&lng=${hotspot.centroid.lng}`
            );
            if (placeResponse.ok) {
              const placeData: PlaceInfo = await placeResponse.json();
              setPlaceInfo(placeData);
            }
          } catch (error) {
            console.error("Error fetching place information:", error);
          }
          return;
        }
      }
    }
    // Check if it's a cluster from the heatmap (clusters-heatmap source)
    else if (feature.source === "clusters-heatmap") {
      const clusterId = feature.properties?.id;
      if (clusterId) {
        const hotspot = clusteredHotspots.find((h) => h.id === clusterId);
        if (hotspot) {
          selectHotspot(hotspot);
          // Fetch place info for the cluster centroid
          try {
            const placeResponse = await fetch(
              `/api/places?lat=${hotspot.centroid.lat}&lng=${hotspot.centroid.lng}`
            );
            if (placeResponse.ok) {
              const placeData: PlaceInfo = await placeResponse.json();
              setPlaceInfo(placeData);
            }
          } catch (error) {
            console.error("Error fetching place information:", error);
          }
          return;
        }
      }
    }
    // Handle old hotspot clicks for backward compatibility
    else if (feature.source === "hotspots" && hotspots.length > 0) {
      const hotspotId = feature.properties?.id;
      if (hotspotId) {
        const hotspot = hotspots.find((h) => h.id === hotspotId);
        if (hotspot) {
          selectHotspot(hotspot);
        }
      }
    }
  };

  // Helper function to create a circle polygon with given radius in meters
  const createCircle = (
    center: [number, number],
    radiusInMeters: number,
    numPoints: number = 64
  ) => {
    const [lng, lat] = center;
    const points: [number, number][] = [];
    const R = 6371000; // Earth's radius in meters

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 360) / numPoints;
      const bearing = (angle * Math.PI) / 180;

      const lat1 = (lat * Math.PI) / 180;
      const lng1 = (lng * Math.PI) / 180;

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(radiusInMeters / R) +
          Math.cos(lat1) * Math.sin(radiusInMeters / R) * Math.cos(bearing)
      );

      const lng2 =
        lng1 +
        Math.atan2(
          Math.sin(bearing) * Math.sin(radiusInMeters / R) * Math.cos(lat1),
          Math.cos(radiusInMeters / R) - Math.sin(lat1) * Math.sin(lat2)
        );

      points.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }

    // Close the polygon
    points.push(points[0]);

    return {
      type: "Polygon" as const,
      coordinates: [points],
    };
  };

  // Combine both old hotspots and new clustered hotspots
  const allHotspots = [...hotspots, ...clusteredHotspots];

  const geojson = {
    type: "FeatureCollection" as const,
    features: allHotspots.map((hotspot) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [hotspot.centroid.lng, hotspot.centroid.lat] as [
          number,
          number,
        ],
      },
      properties: {
        id: hotspot.id,
        severity: hotspot.severity_score,
        intersection: hotspot.intersection,
        address: hotspot.address,
        count: hotspot.total_count,
      },
    })),
  };

  // Create debug visualization data: 50m radius circles and individual collision points
  const debugRadiusCircles =
    showDebugView && clusteredHotspots.length > 0
      ? {
          type: "FeatureCollection" as const,
          features: clusteredHotspots.map((hotspot) => ({
            type: "Feature" as const,
            geometry: createCircle(
              [hotspot.centroid.lng, hotspot.centroid.lat],
              50,
              64
            ),
            properties: {
              id: hotspot.id,
              count: hotspot.total_count,
            },
          })),
        }
      : null;

  const debugClusterPoints =
    showDebugView && clusteredHotspots.length > 0
      ? (() => {
          const allPoints = clusteredHotspots.flatMap((hotspot) =>
            (hotspot.collisions || []).map((collision) => ({
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: [collision.lng, collision.lat] as [number, number],
              },
              properties: {
                id: collision.id,
                clusterId: hotspot.id,
                weight: collision.weight,
                fatalities: collision.fatalities,
                injuryCollisions: collision.injuryCollisions,
              },
            }))
          );

          // Debug: Log points being created
          console.log("Debug cluster points created:", allPoints.length);
          if (allPoints.length > 0) {
            console.log("Sample debug point:", allPoints[0]);
          }

          return {
            type: "FeatureCollection" as const,
            features: allPoints,
          };
        })()
      : null;

  return (
    <div className="relative w-full h-full">
      {/* Debug toggle button */}
      {/* <div className="absolute top-4 right-4 z-10">
        <Button
          variant={showDebugView ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDebugView(!showDebugView)}
          className="bg-zinc-900/90 text-white border-zinc-700 hover:bg-zinc-800"
        >
          {showDebugView ? "Hide" : "Show"} Debug View
        </Button>
      </div> */}

      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        onClick={handleMapClick}
        interactiveLayerIds={[
          "clusters-heat",
          "clusters-point",
          "cluster-circles",
          "hotspot-circles",
          ...(showDebugView ? ["debug-cluster-points-layer"] : []),
        ]}
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

        {/* Heatmap layer for clusters */}
        {clusteredHotspots.length > 0 && (
          <Source
            id="clusters-heatmap"
            type="geojson"
            data={clustersToGeoJSON(clusteredHotspots)}
          >
            <Layer
              id="clusters-heat"
              type="heatmap"
              maxzoom={12}
              slot="top"
              paint={{
                // Increase the heatmap weight based on cluster total_count (normalized to weight)
                "heatmap-weight": [
                  "interpolate",
                  ["linear"],
                  ["get", "weight"],
                  0,
                  0,
                  3,
                  1,
                ],
                // Increase the heatmap color intensity by zoom level - more intense for better visibility
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  1.5,
                  6,
                  2.5,
                  10,
                  4,
                  12,
                  5,
                ],
                // Traditional heatmap color ramp: dark blue (cool/low) -> cyan -> yellow -> orange -> red (hot/high)
                // Based on the Mapbox example but more vibrant
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(33,102,172,0)", // Transparent dark blue start for blur effect
                  0.15,
                  "rgba(103,169,207,0.4)", // Light blue - low density
                  0.3,
                  "rgba(209,229,240,0.6)", // Pale blue - low-medium
                  0.45,
                  "rgba(253,219,199,0.7)", // Pale orange - medium
                  0.6,
                  "rgba(239,138,98,0.8)", // Orange - medium-high
                  0.75,
                  "rgba(239,101,72,0.9)", // Red-orange - high
                  0.9,
                  "rgba(186,47,53,0.95)", // Dark red - very high
                  1,
                  "rgba(178,24,43,1)", // Deep red - maximum density
                ],
                // Adjust the heatmap radius by zoom level - larger radius for better blending effect
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  20,
                  5,
                  35,
                  9,
                  50,
                  12,
                  65,
                ],
                // Keep heatmap fully visible until zoom 12, then fade to circles
                "heatmap-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  1,
                  11,
                  1,
                  12,
                  0.6,
                  13,
                  0,
                ],
              }}
            />
            <Layer
              id="clusters-point"
              type="circle"
              minzoom={11}
              paint={{
                // Size circle radius by weight (total_count) and zoom level - only show at high zoom
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  11,
                  ["interpolate", ["linear"], ["get", "weight"], 0.5, 4, 3, 10],
                  16,
                  [
                    "interpolate",
                    ["linear"],
                    ["get", "weight"],
                    0.5,
                    10,
                    3,
                    30,
                  ],
                ],
                "circle-emissive-strength": 0.75,
                // Color circle by weight (cluster size/severity) - matching heatmap colors
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "weight"],
                  0.5,
                  "rgba(0,200,255,0.9)", // Cyan-blue for small clusters
                  1.5,
                  "rgba(255,200,0,0.95)", // Orange for medium clusters
                  3,
                  "rgba(255,0,0,1)", // Red for large clusters
                ],
                "circle-stroke-color": "rgba(255,255,255,0.8)",
                "circle-stroke-width": 1.5,
                // Transition from heatmap to circle layer at higher zoom
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  11,
                  0,
                  12,
                  0.7,
                  13,
                  1,
                ],
              }}
            />
          </Source>
        )}

        {/* Clustered hotspots - these are problem areas with repeated accidents */}
        {clusteredHotspots.length > 0 && (
          <Source
            id="clusters"
            type="geojson"
            data={{
              type: "FeatureCollection" as const,
              features: clusteredHotspots.map((hotspot) => ({
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [hotspot.centroid.lng, hotspot.centroid.lat] as [
                    number,
                    number,
                  ],
                },
                properties: {
                  id: hotspot.id,
                  severity: hotspot.severity_score,
                  intersection: hotspot.intersection,
                  address: hotspot.address,
                  count: hotspot.total_count,
                },
              })),
            }}
          >
            <Layer
              id="cluster-circles"
              type="circle"
              minzoom={11}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  11,
                  [
                    "interpolate",
                    ["linear"],
                    ["get", "count"],
                    2,
                    8,
                    10,
                    15,
                    50,
                    25,
                  ],
                  16,
                  [
                    "interpolate",
                    ["linear"],
                    ["get", "count"],
                    2,
                    15,
                    10,
                    30,
                    50,
                    50,
                  ],
                ],
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "severity"],
                  0,
                  "#22c55e", // Green for low severity
                  40,
                  "#eab308", // Yellow for medium
                  60,
                  "#f59e0b", // Orange for medium-high
                  80,
                  "#ef4444", // Red for high
                  90,
                  "#dc2626", // Dark red for very high
                  100,
                  "#991b1b", // Very dark red for critical
                ],
                "circle-opacity": 0.85,
                "circle-stroke-width": [
                  "interpolate",
                  ["linear"],
                  ["get", "count"],
                  2,
                  2,
                  10,
                  3,
                  50,
                  4,
                ],
                "circle-stroke-color": "#ffffff",
                "circle-stroke-opacity": 0.9,
              }}
            />
          </Source>
        )}

        {/* Legacy hotspots for backward compatibility */}
        {hotspots.length > 0 && (
          <Source
            id="hotspots"
            type="geojson"
            data={{
              type: "FeatureCollection" as const,
              features: hotspots.map((hotspot) => ({
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [hotspot.centroid.lng, hotspot.centroid.lat] as [
                    number,
                    number,
                  ],
                },
                properties: {
                  id: hotspot.id,
                  severity: hotspot.severity_score,
                  intersection: hotspot.intersection,
                  address: hotspot.address,
                },
              })),
            }}
          >
            <Layer
              id="hotspot-circles"
              type="circle"
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["get", "severity"],
                  50,
                  10,
                  100,
                  20,
                ],
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "severity"],
                  0,
                  "#22c55e",
                  50,
                  "#f59e0b",
                  80,
                  "#ef4444",
                ],
                "circle-opacity": 0.8,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}

        {/* Debug visualization: 50m radius circles around clusters */}
        {showDebugView && debugRadiusCircles && (
          <Source
            id="debug-radius-circles"
            type="geojson"
            data={debugRadiusCircles}
          >
            <Layer
              id="debug-radius-fill"
              type="fill"
              paint={{
                "fill-color": "rgba(59, 130, 246, 0.2)", // Blue fill with transparency
                "fill-outline-color": "rgba(59, 130, 246, 0.8)", // Blue outline
              }}
            />
          </Source>
        )}

        {/* Debug visualization: Individual collision points from clusters */}
        {showDebugView &&
          debugClusterPoints &&
          debugClusterPoints.features.length > 0 && (
            <Source
              id="debug-cluster-points"
              type="geojson"
              data={debugClusterPoints}
            >
              <Layer
                id="debug-cluster-points-layer"
                type="circle"
                minzoom={0}
                paint={{
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    6,
                    10,
                    8,
                    14,
                    10,
                    16,
                    12,
                  ],
                  "circle-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "weight"],
                    1,
                    "#22c55e", // Bright green for low severity
                    2,
                    "#fbbf24", // Bright yellow for medium
                    3,
                    "#ef4444", // Bright red for high
                  ],
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 3,
                  "circle-opacity": 1,
                  "circle-stroke-opacity": 1,
                }}
              />
            </Source>
          )}
      </Map>
    </div>
  );
}
