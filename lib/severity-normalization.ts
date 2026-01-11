import type { ClusteredHotspot } from "@/types/collision";

/**
 * Normalizes severity scores using percentile ranking
 * This spreads out scores that are clustered around similar values by ranking
 * them relative to all other hotspots. Scores are mapped to percentiles (0-100)
 * based on their position in the distribution.
 * 
 * @param rawScore - The raw severity score to normalize
 * @param allHotspots - Array of all hotspots to calculate percentiles from
 * @returns Normalized score between 0-100 based on percentile rank
 */
export function normalizeSeverityScore(
  rawScore: number,
  allHotspots: ClusteredHotspot[]
): number {
  if (allHotspots.length === 0) {
    return rawScore;
  }

  // Extract all severity scores and sort them
  const scores = allHotspots.map((h) => h.severity_score).sort((a, b) => a - b);
  
  // If all scores are the same, return 50 (middle value)
  if (scores[0] === scores[scores.length - 1]) {
    return 50;
  }

  // Calculate percentile rank: what percentage of scores are <= rawScore
  // This ranks the score relative to all other scores
  const rank = scores.filter((s) => s <= rawScore).length;
  const percentile = (rank / scores.length) * 100;

  // Round to nearest integer and clamp to 0-100
  return Math.round(Math.max(0, Math.min(100, percentile)));
}
