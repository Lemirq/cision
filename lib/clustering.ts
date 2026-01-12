import type { CollisionPoint, ClusteredHotspot } from "@/types/collision";

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in meters
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate the centroid (average) of a set of collision points
 */
function calculateCentroid(collisions: CollisionPoint[]): { lat: number; lng: number } {
  if (collisions.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const sumLat = collisions.reduce((sum, c) => sum + c.lat, 0);
  const sumLng = collisions.reduce((sum, c) => sum + c.lng, 0);
  
  return {
    lat: sumLat / collisions.length,
    lng: sumLng / collisions.length,
  };
}

/**
 * Find all collisions within a certain distance of a point
 */
function findNearbyCollisions(
  center: CollisionPoint,
  allCollisions: CollisionPoint[],
  maxDistance: number,
  excludeIndices: Set<number>
): { collisions: CollisionPoint[]; indices: number[] } {
  const nearby: CollisionPoint[] = [center];
  const foundIndices: number[] = [];
  
  allCollisions.forEach((collision, index) => {
    if (excludeIndices.has(index)) return;
    if (collision.id === center.id) {
      foundIndices.push(index);
      return;
    }
    
    const distance = haversineDistance(
      center.lat,
      center.lng,
      collision.lat,
      collision.lng
    );
    
    if (distance <= maxDistance) {
      nearby.push(collision);
      foundIndices.push(index);
    }
  });
  
  return { collisions: nearby, indices: foundIndices };
}

/**
 * Cluster collisions based on proximity.
 * Groups collisions within 50m, with special handling for tight clusters (15m).
 * 
 * Algorithm:
 * 1. Create tight clusters (15m) - repeated accidents at the same spot (highest priority)
 * 2. Expand existing clusters to include collisions within 50m
 * 3. Create new clusters for remaining collisions within 50m of each other
 */
export function clusterCollisions(
  collisions: CollisionPoint[]
): ClusteredHotspot[] {
  if (collisions.length === 0) {
    return [];
  }

  const TIGHT_CLUSTER_DISTANCE = 15; // meters - multiple collisions at same spot
  const EXPANDED_CLUSTER_DISTANCE = 50; // meters - nearby problem areas
  const processedIndices = new Set<number>();
  const clusters: CollisionPoint[][] = [];

  // First pass: Create tight clusters (15m) - these are repeated accidents at the same spot
  // This identifies the most problematic locations where multiple accidents occur at the exact same spot
  for (let i = 0; i < collisions.length; i++) {
    if (processedIndices.has(i)) continue;

    const collision = collisions[i];
    const result = findNearbyCollisions(
      collision,
      collisions,
      TIGHT_CLUSTER_DISTANCE,
      processedIndices
    );

    // Only create a cluster if there are multiple collisions within 15m
    // Single collisions at unique spots indicate human error, not infrastructure problems
    if (result.collisions.length > 1) {
      result.indices.forEach((idx) => processedIndices.add(idx));
      clusters.push(result.collisions);
    }
  }

  // Second pass: Expand existing tight clusters by including nearby collisions within 50m
  // This merges nearby problem areas into larger clusters
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      const cluster = clusters[clusterIndex];
      const centroid = calculateCentroid(cluster);
      
      // Find collisions within 50m of the cluster centroid that haven't been processed
      const expandedCollisions: CollisionPoint[] = [];
      const expandedIndices: number[] = [];
      
      for (let i = 0; i < collisions.length; i++) {
        if (processedIndices.has(i)) continue;
        
        const collision = collisions[i];
        const distance = haversineDistance(
          centroid.lat,
          centroid.lng,
          collision.lat,
          collision.lng
        );
        
        if (distance <= EXPANDED_CLUSTER_DISTANCE) {
          expandedCollisions.push(collision);
          expandedIndices.push(i);
          processedIndices.add(i);
        }
      }
      
      if (expandedCollisions.length > 0) {
        clusters[clusterIndex] = [...cluster, ...expandedCollisions];
        expanded = true;
      }
    }
  }

  // Third pass: Create new clusters for remaining unprocessed collisions within 50m
  // These are problem areas that didn't have tight clusters but still have repeated accidents nearby
  for (let i = 0; i < collisions.length; i++) {
    if (processedIndices.has(i)) continue;

    const collision = collisions[i];
    const result = findNearbyCollisions(
      collision,
      collisions,
      EXPANDED_CLUSTER_DISTANCE,
      processedIndices
    );

    // Create cluster if there are 2 or more collisions within 50m
    // Single collisions indicate human error, not infrastructure problems
    if (result.collisions.length >= 2) {
      result.indices.forEach((idx) => processedIndices.add(idx));
      clusters.push(result.collisions);
    }
  }

  // Convert clusters to ClusteredHotspot format
  const hotspots: ClusteredHotspot[] = clusters.map((cluster, index) => {
    const centroid = calculateCentroid(cluster);
    
    // Calculate cluster statistics
    const totalCount = cluster.length;
    const fatalCount = cluster.reduce((sum, c) => sum + (c.fatalities || 0), 0);
    const cyclistCount = cluster.filter((c) => c.bicycle).length;
    const pedestrianCount = cluster.filter((c) => c.pedestrian).length;
    
    // Calculate severity score based on cluster characteristics
    // Using log scaling to prevent scores from hitting 100 too quickly
    // and to better reflect the relative distribution of data points
    let severityScore = 10 + Math.log1p(totalCount) * 8;
    
    // Increase score for fatalities (log scaled, capped at 25)
    if (fatalCount > 0) {
      severityScore += Math.min(Math.log1p(fatalCount) * 12, 25);
    }
    
    // Increase score for vulnerable road users (cyclists, pedestrians)
    const vulnerableCount = cyclistCount + pedestrianCount;
    if (vulnerableCount > 0) {
      severityScore += Math.min(Math.log1p(vulnerableCount) * 8, 20);
    }
    
    // Increase score for injury collisions
    const injuryCount = cluster.filter((c) => c.injuryCollisions).length;
    if (injuryCount > 0) {
      severityScore += Math.min(Math.log1p(injuryCount) * 6, 15);
    }
    
    // Scale to approximately 0-100 range based on expected max
    severityScore = Math.min(Math.round(severityScore), 100);

    // Use the most common neighborhood or first collision's neighborhood
    const neighborhoods = cluster.map((c) => c.neighbourhood).filter(Boolean);
    const mostCommonNeighborhood =
      neighborhoods.length > 0
        ? neighborhoods.reduce(
            (a, b, _, arr) => (arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b),
            neighborhoods[0]
          )
        : "Unknown";

    return {
      id: `cluster-${index}`,
      centroid,
      collisions: cluster, // Store all collisions in the cluster
      severity_score: Math.round(severityScore),
      total_count: totalCount,
      fatal_count: fatalCount,
      cyclist_count: cyclistCount,
      pedestrian_count: pedestrianCount,
      address: mostCommonNeighborhood || "Unknown location",
      intersection: mostCommonNeighborhood || "Intersection",
    };
  });

  return hotspots;
}
