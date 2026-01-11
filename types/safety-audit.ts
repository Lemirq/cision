export interface SafetyAuditResult {
  walkabilityScore: number;
  metrics: SafetyMetrics;
  flaws: SafetyFlaw[];
  suggestions: ImprovementSuggestion[];
  infrastructureGaps: string[];
  stitchedImageUrl?: string; // Base64 data URL of the stitched composite image (2x2 grid: N, E, S, W)
}

export interface SafetyMetrics {
  signage: number;
  lighting: number;
  crosswalkVisibility: number;
  bikeInfrastructure: number;
  pedestrianInfrastructure: number;
  trafficCalming: number;
}

export interface SafetyFlaw {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  category: string;
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedCost: string;
  expectedImpact: string;
}
