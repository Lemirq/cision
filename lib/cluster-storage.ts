import type { ClusteredHotspot } from "@/types/collision";
import type { SafetyAuditResult } from "@/types/safety-audit";
import type { StoredClusterData, ImageVersion } from "@/types/cluster-storage";
import { useMapStore } from "@/stores/map-store";

/**
 * Get cluster data from state store
 */
export function getClusterData(clusterId: string): StoredClusterData | null {
  return useMapStore.getState().getClusterData(clusterId);
}

/**
 * Save cluster data to state store
 */
export function saveClusterData(clusterId: string, data: StoredClusterData): void {
  useMapStore.getState().setClusterData(clusterId, data);
}

/**
 * Initialize cluster data if it doesn't exist
 */
export function initializeClusterData(
  clusterId: string,
  clusterInfo: ClusteredHotspot
): StoredClusterData {
  const existing = getClusterData(clusterId);
  if (existing) return existing;

  const newData: StoredClusterData = {
    clusterId,
    clusterInfo,
    images: {
      original: "",
      history: [],
      current: null,
    },
    lastUpdated: Date.now(),
  };

  saveClusterData(clusterId, newData);
  return newData;
}

/**
 * Update safety audit for a cluster
 */
export function updateSafetyAudit(
  clusterId: string,
  audit: SafetyAuditResult,
  clusterInfo?: ClusteredHotspot
): void {
  const existing = getClusterData(clusterId);
  const clusterData = clusterInfo
    ? initializeClusterData(clusterId, clusterInfo)
    : existing || initializeClusterData(clusterId, {
        id: clusterId,
        centroid: { lat: 0, lng: 0 },
        collisions: [],
        severity_score: 0,
        total_count: 0,
        fatal_count: 0,
        cyclist_count: 0,
        pedestrian_count: 0,
        address: "",
        intersection: "",
      });

  // Store audit with full stitchedImageUrl (no size restrictions in state store)
  clusterData.safetyAudit = audit;
  
  // Save original stitched image if it exists
  if (audit.stitchedImageUrl && !clusterData.images.original) {
    clusterData.images.original = audit.stitchedImageUrl;
  }

  saveClusterData(clusterId, clusterData);
}

/**
 * Add an image version to cluster history
 */
export function addImageVersion(
  clusterId: string,
  version: Omit<ImageVersion, "id" | "timestamp">
): void {
  const store = useMapStore.getState();
  const existing = store.getClusterData(clusterId);
  if (!existing) {
    console.warn(`Cluster ${clusterId} not found. Cannot add image version.`);
    return;
  }

  const newVersion: ImageVersion = {
    ...version,
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  store.updateClusterData(clusterId, (data) => ({
    ...data,
    images: {
      ...data.images,
      history: [...data.images.history, newVersion],
      current: newVersion.imageUrl,
    },
    lastUpdated: Date.now(),
  }));
}

/**
 * Update current image for a cluster
 */
export function updateCurrentImage(clusterId: string, imageUrl: string): void {
  const store = useMapStore.getState();
  const existing = store.getClusterData(clusterId);
  if (!existing) {
    console.warn(`Cluster ${clusterId} not found. Cannot update current image.`);
    return;
  }

  store.updateClusterData(clusterId, (data) => ({
    ...data,
    images: {
      ...data.images,
      current: imageUrl,
    },
    lastUpdated: Date.now(),
  }));
}

/**
 * Build context string for AI agents (both voice and chat)
 */
export function getClusterContext(clusterId: string): string {
  const clusterData = getClusterData(clusterId);
  if (!clusterData) return "";

  const parts: string[] = [];

  // Cluster basic info
  parts.push(
    `Cluster: ${clusterData.clusterInfo.intersection || clusterData.clusterInfo.address}`
  );
  parts.push(
    `Location: ${clusterData.clusterInfo.address} (${clusterData.clusterInfo.total_count} collisions, ${clusterData.clusterInfo.fatal_count} fatal)`
  );

  // Safety audit information
  if (clusterData.safetyAudit) {
    const audit = clusterData.safetyAudit;

    // Calculate safety score
    const safetyScore = Math.floor(
      (audit.metrics.signage +
        audit.metrics.lighting +
        audit.metrics.crosswalkVisibility +
        audit.metrics.bikeInfrastructure +
        audit.metrics.pedestrianInfrastructure +
        audit.metrics.trafficCalming) /
        6
    );

    parts.push(`Safety Score: ${safetyScore}/100`);
    parts.push("");

    // Flaws
    if (audit.flaws.length > 0) {
      parts.push("Issues Identified:");
      audit.flaws.forEach((flaw) => {
        parts.push(`- ${flaw.title}: ${flaw.description} (${flaw.severity} severity)`);
      });
      parts.push("");
    }

    // Suggestions
    if (audit.suggestions.length > 0) {
      parts.push("Improvement Suggestions:");
      audit.suggestions.forEach((suggestion) => {
        parts.push(
          `- ${suggestion.title}: ${suggestion.description} (${suggestion.priority} priority)`
        );
      });
      parts.push("");
    }

    // Missing infrastructure
    if (audit.infrastructureGaps.length > 0) {
      parts.push("Missing Infrastructure:");
      audit.infrastructureGaps.forEach((gap) => {
        parts.push(`- ${gap}`);
      });
      parts.push("");
    }
  }

  // Image history and recent improvements
  if (clusterData.images.history.length > 0) {
    parts.push("Recent Improvements:");
    const recentVersions = clusterData.images.history
      .slice(-5)
      .reverse(); // Last 5, newest first

    recentVersions.forEach((version) => {
      const timeAgo = formatTimeAgo(version.timestamp);
      if (version.prompt) {
        parts.push(`- ${version.prompt} (${timeAgo})`);
      } else if (version.description) {
        parts.push(`- ${version.description} (${timeAgo})`);
      }
    });
    parts.push("");
  }

  // Current state
  if (clusterData.images.current && clusterData.images.current !== clusterData.images.original) {
    parts.push(
      "Current State: The intersection has been modified from the original. The latest version is active."
    );
  } else {
    parts.push("Current State: Original intersection imagery.");
  }

  return parts.join("\n");
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  return "just now";
}

/**
 * Get infrastructure gaps for a cluster (for pill suggestions)
 */
export function getInfrastructureGaps(clusterId: string): string[] {
  const clusterData = getClusterData(clusterId);
  return clusterData?.safetyAudit?.infrastructureGaps || [];
}
