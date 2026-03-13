// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";
import type { SafetyAuditResult } from "@/types/safety-audit";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clusterData,
    }: {
      lat?: number;
      lng?: number;
      clusterData: {
        address: string;
        total_count: number;
        fatal_count: number;
        cyclist_count: number;
        pedestrian_count: number;
      };
      imageUrl?: string;
    } = body;

    // Return a hard-coded demo safety audit result with realistic Toronto intersection data
    const demoAudit: SafetyAuditResult = {
      walkabilityScore: 52,
      metrics: {
        signage: 58,
        lighting: 45,
        crosswalkVisibility: 50,
        bikeInfrastructure: 30,
        pedestrianInfrastructure: 55,
        trafficCalming: 35,
      },
      flaws: [
        {
          title: "Lack of Protected Bike Lanes",
          description:
            "The intersection has no dedicated or protected cycling infrastructure, forcing cyclists to share lanes with fast-moving vehicular traffic.",
          severity: "high",
          category: "Bike Infrastructure",
        },
        {
          title: "Faded Crosswalk Markings",
          description:
            "Crosswalk pavement markings are significantly worn and difficult to see, especially in wet or low-light conditions.",
          severity: "high",
          category: "Crosswalk Visibility",
        },
        {
          title: "Insufficient Pedestrian Lighting",
          description:
            "Street lighting at the intersection does not adequately illuminate pedestrian crossing areas during nighttime hours.",
          severity: "medium",
          category: "Lighting",
        },
        {
          title: "No Traffic Calming Measures",
          description:
            "The wide lane widths and straight approach encourage higher vehicle speeds through the intersection with no physical or visual traffic calming.",
          severity: "medium",
          category: "Traffic Calming",
        },
        {
          title: "Missing Accessible Pedestrian Signals",
          description:
            "Pedestrian signal heads lack audible or tactile indicators for visually impaired pedestrians.",
          severity: "low",
          category: "Pedestrian Infrastructure",
        },
      ],
      suggestions: [
        {
          title: "Install Protected Bike Lanes",
          description:
            `Add physically separated bike lanes with concrete curbs or bollards on all approaches to ${clusterData.address}.`,
          priority: "high",
          estimatedCost: "$150,000 - $300,000",
          expectedImpact:
            `Could reduce cyclist collisions by up to 75% based on the ${clusterData.cyclist_count} recorded cyclist incidents.`,
        },
        {
          title: "Repaint High-Visibility Crosswalks",
          description:
            "Apply continental-style (ladder) crosswalk markings with retroreflective paint on all pedestrian crossings.",
          priority: "high",
          estimatedCost: "$5,000 - $15,000",
          expectedImpact:
            `Improved visibility could reduce pedestrian-vehicle conflicts given the ${clusterData.pedestrian_count} recorded pedestrian incidents.`,
        },
        {
          title: "Upgrade Pedestrian Lighting",
          description:
            "Install dedicated LED pedestrian-scale lighting fixtures at each crosswalk approach to improve nighttime visibility.",
          priority: "medium",
          estimatedCost: "$40,000 - $80,000",
          expectedImpact:
            "Enhanced nighttime visibility could reduce after-dark collisions by approximately 40%.",
        },
        {
          title: "Add Curb Extensions and Raised Crosswalks",
          description:
            "Build curb extensions (bulb-outs) at corners and raise crosswalks to sidewalk level to slow turning vehicles.",
          priority: "medium",
          estimatedCost: "$75,000 - $150,000",
          expectedImpact:
            "Traffic calming could reduce vehicle speeds by 10-15 km/h and shorten pedestrian crossing distances.",
        },
        {
          title: "Install Accessible Pedestrian Signals",
          description:
            "Upgrade all pedestrian signal heads with audible countdown timers and tactile push buttons compliant with AODA standards.",
          priority: "low",
          estimatedCost: "$20,000 - $40,000",
          expectedImpact:
            "Improved accessibility for visually impaired pedestrians and clearer crossing guidance for all users.",
        },
      ],
      infrastructureGaps: [
        "Add protected bike lanes with physical separation",
        "Install pedestrian refuge islands at wide crossings",
        "Add raised crosswalks with high-visibility markings",
        "Install dedicated pedestrian-scale lighting",
        "Add curb extensions to reduce crossing distances",
        "Install audible pedestrian countdown signals",
      ],
    };

    return NextResponse.json(demoAudit);
  } catch (error) {
    console.error("Error generating safety audit:", error);
    return NextResponse.json(
      {
        error: "Failed to generate safety audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
