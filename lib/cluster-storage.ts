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

/**
 * Build comprehensive safety audit context for AI agents
 * Returns a structured, detailed context string with all cluster metadata and safety audit data
 */
export function getFullSafetyAuditContext(clusterId: string): string {
  const clusterData = getClusterData(clusterId);
  if (!clusterData) return "";

  const parts: string[] = [];

  // ===== CLUSTER METADATA =====
  parts.push("=== INTERSECTION INFORMATION ===");
  parts.push(`Intersection: ${clusterData.clusterInfo.intersection || "Unknown"}`);
  parts.push(`Address: ${clusterData.clusterInfo.address}`);
  parts.push(`Location: ${clusterData.clusterInfo.centroid.lat.toFixed(6)}, ${clusterData.clusterInfo.centroid.lng.toFixed(6)}`);
  parts.push("");
  
  parts.push("=== COLLISION STATISTICS ===");
  parts.push(`Total Collisions: ${clusterData.clusterInfo.total_count}`);
  parts.push(`Fatal Collisions: ${clusterData.clusterInfo.fatal_count}`);
  parts.push(`Cyclist Collisions: ${clusterData.clusterInfo.cyclist_count}`);
  parts.push(`Pedestrian Collisions: ${clusterData.clusterInfo.pedestrian_count}`);
  parts.push(`Severity Score: ${clusterData.clusterInfo.severity_score.toFixed(2)}`);
  parts.push("");

  // ===== SAFETY AUDIT DATA =====
  if (clusterData.safetyAudit) {
    const audit = clusterData.safetyAudit;

    parts.push("=== SAFETY AUDIT RESULTS ===");
    parts.push(`Walkability Score: ${audit.walkabilityScore}/100`);
    parts.push("");

    // Safety Metrics (all 6 metrics with scores)
    parts.push("=== SAFETY METRICS (0-100 scale) ===");
    parts.push(`Signage: ${audit.metrics.signage}/100`);
    parts.push(`Lighting: ${audit.metrics.lighting}/100`);
    parts.push(`Crosswalk Visibility: ${audit.metrics.crosswalkVisibility}/100`);
    parts.push(`Bike Infrastructure: ${audit.metrics.bikeInfrastructure}/100`);
    parts.push(`Pedestrian Infrastructure: ${audit.metrics.pedestrianInfrastructure}/100`);
    parts.push(`Traffic Calming: ${audit.metrics.trafficCalming}/100`);
    
    // Calculate average safety score
    const avgSafetyScore = Math.floor(
      (audit.metrics.signage +
        audit.metrics.lighting +
        audit.metrics.crosswalkVisibility +
        audit.metrics.bikeInfrastructure +
        audit.metrics.pedestrianInfrastructure +
        audit.metrics.trafficCalming) / 6
    );
    parts.push(`Average Safety Score: ${avgSafetyScore}/100`);
    parts.push("");

    // Safety Flaws
    if (audit.flaws.length > 0) {
      parts.push("=== IDENTIFIED SAFETY FLAWS ===");
      audit.flaws.forEach((flaw, index) => {
        parts.push(`${index + 1}. ${flaw.title}`);
        parts.push(`   Description: ${flaw.description}`);
        parts.push(`   Severity: ${flaw.severity.toUpperCase()}`);
        parts.push(`   Category: ${flaw.category}`);
        parts.push("");
      });
    } else {
      parts.push("=== IDENTIFIED SAFETY FLAWS ===");
      parts.push("No safety flaws identified.");
      parts.push("");
    }

    // Improvement Suggestions
    if (audit.suggestions.length > 0) {
      parts.push("=== IMPROVEMENT SUGGESTIONS ===");
      audit.suggestions.forEach((suggestion, index) => {
        parts.push(`${index + 1}. ${suggestion.title}`);
        parts.push(`   Description: ${suggestion.description}`);
        parts.push(`   Priority: ${suggestion.priority.toUpperCase()}`);
        parts.push(`   Estimated Cost: ${suggestion.estimatedCost}`);
        parts.push(`   Expected Impact: ${suggestion.expectedImpact}`);
        parts.push("");
      });
    } else {
      parts.push("=== IMPROVEMENT SUGGESTIONS ===");
      parts.push("No improvement suggestions available.");
      parts.push("");
    }

    // Infrastructure Gaps
    if (audit.infrastructureGaps.length > 0) {
      parts.push("=== MISSING INFRASTRUCTURE ===");
      audit.infrastructureGaps.forEach((gap, index) => {
        parts.push(`${index + 1}. ${gap}`);
      });
      parts.push("");
    } else {
      parts.push("=== MISSING INFRASTRUCTURE ===");
      parts.push("No infrastructure gaps identified.");
      parts.push("");
    }
  } else {
    parts.push("=== SAFETY AUDIT RESULTS ===");
    parts.push("No safety audit data available for this intersection.");
    parts.push("");
  }

  // ===== IMAGE HISTORY & RECENT IMPROVEMENTS =====
  if (clusterData.images.history.length > 0) {
    parts.push("=== RECENT IMPROVEMENTS & MODIFICATIONS ===");
    const recentVersions = clusterData.images.history
      .slice(-10)
      .reverse(); // Last 10, newest first

    recentVersions.forEach((version, index) => {
      const timeAgo = formatTimeAgo(version.timestamp);
      parts.push(`${index + 1}. ${timeAgo}`);
      if (version.prompt) {
        parts.push(`   Prompt: ${version.prompt}`);
      }
      if (version.description) {
        parts.push(`   Description: ${version.description}`);
      }
      parts.push("");
    });
  } else {
    parts.push("=== RECENT IMPROVEMENTS & MODIFICATIONS ===");
    parts.push("No recent improvements have been made to this intersection.");
    parts.push("");
  }

  // ===== CURRENT STATE =====
  parts.push("=== CURRENT INTERSECTION STATE ===");
  if (clusterData.images.current && clusterData.images.current !== clusterData.images.original) {
    parts.push("The intersection has been modified from the original design.");
    parts.push("The latest version is currently active and displayed.");
  } else {
    parts.push("The intersection is in its original state (no modifications have been applied).");
  }
  parts.push("");

  return parts.join("\n");
}
