import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import sharp from "sharp";
import type { SafetyAuditResult } from "@/types/safety-audit";

export const maxDuration = 30;

// Zod schema for structured output
const safetyAuditSchema = z.object({
  walkabilityScore: z.number().min(0).max(100),
  metrics: z.object({
    signage: z.number().min(0).max(100),
    lighting: z.number().min(0).max(100),
    crosswalkVisibility: z.number().min(0).max(100),
    bikeInfrastructure: z.number().min(0).max(100),
    pedestrianInfrastructure: z.number().min(0).max(100),
    trafficCalming: z.number().min(0).max(100),
  }),
  flaws: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      category: z.string(),
    })
  ),
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimatedCost: z.string(),
      expectedImpact: z.string(),
    })
  ),
  infrastructureGaps: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lat,
      lng,
      clusterData,
    }: {
      lat: number;
      lng: number;
      clusterData: {
        address: string;
        total_count: number;
        fatal_count: number;
        cyclist_count: number;
        pedestrian_count: number;
      };
    } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey =
      process.env.GOOGLE_GEMINI_API || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Google Gemini API key not configured. Please set GOOGLE_GEMINI_API or GOOGLE_GENERATIVE_AI_API_KEY in your environment.",
        },
        { status: 500 }
      );
    }

    // Set the API key for the Google provider
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    // Fetch street view images from all 4 directions (0, 90, 180, 270 degrees)
    const headings = [0, 90, 180, 270];
    const origin = req.nextUrl.origin;
    
    const imageBuffers = await Promise.all(
      headings.map(async (heading) => {
        const imageUrl = `${origin}/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch street view image at heading ${heading}`);
        }
        return Buffer.from(await response.arrayBuffer());
      })
    );


    // Stitch images together: arrange them side by side in a single row
    // Order: N (0°), E (90°), S (180°), W (270°)
    // Layout: [N] [E] [S] [W] (all in one row)
    const imageWidth = 640;
    const imageHeight = 640;
    const compositeWidth = imageWidth * 4; // 4 images side by side
    const compositeHeight = imageHeight;

    // Create composite image using sharp
    // imageBuffers[0] = 0° (N), [1] = 90° (E), [2] = 180° (S), [3] = 270° (W)
    const compositeImage = await sharp({
      create: {
        width: compositeWidth,
        height: compositeHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        // First: 0° (north)
        {
          input: imageBuffers[0],
          left: 0,
          top: 0,
        },
        // Second: 90° (east)
        {
          input: imageBuffers[1],
          left: imageWidth,
          top: 0,
        },
        // Third: 180° (south)
        {
          input: imageBuffers[2],
          left: imageWidth * 2,
          top: 0,
        },
        // Fourth: 270° (west)
        {
          input: imageBuffers[3],
          left: imageWidth * 3,
          top: 0,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert to Uint8Array for Gemini
    const imageUint8Array = new Uint8Array(compositeImage);

    // Build the prompt
    const prompt = `You are an expert urban safety analyst with 20 years of experience in traffic engineering. You specialize in Vision Zero initiatives.

Analyze this PANORAMIC intersection image for pedestrian and cyclist safety hazards. The image is a panoramic composite showing views from all four cardinal directions (North, East, South, West) arranged side-by-side in a single row. This gives you a 360-degree view of the intersection.

CONTEXT:
- Location: ${clusterData.address}
- Historical collisions: ${clusterData.total_count} (${clusterData.fatal_count} fatal)
- Cyclist incidents: ${clusterData.cyclist_count}
- Pedestrian incidents: ${clusterData.pedestrian_count}

ANALYSIS FRAMEWORK:
1. VISIBILITY: Can drivers see pedestrians? Are sightlines obstructed?
2. INFRASTRUCTURE: Are there protected lanes, bollards, refuge islands?
3. MARKINGS: Are crosswalks clearly painted? Are lane markings visible?
4. SIGNALS: Are there pedestrian signals? Is timing adequate?
5. SPEED: Does the road design encourage speeding?
6. SIGNAGE: Are signs clear, visible, and appropriate?
7. LIGHTING: Is there adequate lighting for nighttime safety?
8. TRAFFIC CALMING: Are there measures to slow traffic?

Provide a comprehensive safety audit with:
- Overall walkability score (0-100) based on all factors
- Individual metric scores for: signage, lighting, crosswalk visibility, bike infrastructure, pedestrian infrastructure, and traffic calming
- 3-5 critical safety flaws with specific descriptions
- Actionable improvement suggestions with priority, cost estimates, and expected impact
- List of missing infrastructure elements

Be SPECIFIC. Reference ACTUAL visual elements in the image.`;

    // Generate the safety audit using structured output
    const result = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          {
            type: "image",
            image: imageUint8Array,
            mediaType: "image/jpeg",
          },
          ],
        },
      ],
      output: Output.object({
        schema: safetyAuditSchema,
      }),
    });

    // Convert stitched composite image to base64 data URL for UI display
    const stitchedImageBase64 = compositeImage.toString("base64");
    const stitchedImageUrl = `data:image/jpeg;base64,${stitchedImageBase64}`;

    // Combine the audit result with the stitched image URL
    const auditResult = result.output as SafetyAuditResult;
    const response: SafetyAuditResult = {
      ...auditResult,
      stitchedImageUrl,
    };

    // Return the structured output with stitched image
    return NextResponse.json(response);
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
