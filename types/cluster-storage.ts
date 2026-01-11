import type { ClusteredHotspot } from "./collision";
import type { SafetyAuditResult } from "./safety-audit";

export interface ImageVersion {
  id: string; // Unique version ID
  imageUrl: string; // Base64 data URL
  prompt?: string; // User prompt that created this version
  parentVersionId?: string; // ID of parent version (for history tracking)
  timestamp: number;
  description?: string; // AI-generated description of changes
}

export interface StoredClusterData {
  clusterId: string;
  clusterInfo: ClusteredHotspot; // Original cluster data
  safetyAudit?: SafetyAuditResult; // Most recent audit (includes infrastructureGaps)
  images: {
    original: string; // Original stitched image URL
    history: ImageVersion[]; // Complete version history
    current: string | null; // Current active image (latest version)
  };
  lastUpdated: number; // Timestamp
}
