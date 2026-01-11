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
      imageUrl, // Optional: single image URL (base64 data URL or regular URL)
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
      imageUrl?: string; // For single image audits
    } = body;

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

    let imageUint8Array: Uint8Array;
    let isSingleImage = false;

    // If imageUrl is provided, use it (single image audit)
    if (imageUrl) {
      isSingleImage = true;
      let imageBuffer: ArrayBuffer;

      if (imageUrl.startsWith("data:")) {
        // Handle data URL (base64)
        const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!base64Match) {
          return NextResponse.json(
            { error: "Invalid data URL format" },
            { status: 400 }
          );
        }
        const base64Data = base64Match[2];
        imageBuffer = Buffer.from(base64Data, "base64").buffer;
      } else {
        // Handle regular URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: "Failed to fetch image" },
            { status: 400 }
          );
        }
        imageBuffer = await imageResponse.arrayBuffer();
      }

      imageUint8Array = new Uint8Array(imageBuffer);
    } else {
      // Original behavior: fetch 360 panorama from street view
      if (!lat || !lng) {
        return NextResponse.json(
          { error: "Latitude and longitude are required when imageUrl is not provided" },
          { status: 400 }
        );
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
      imageUint8Array = new Uint8Array(compositeImage);
    }

    // Build the prompt
    const imageContext = isSingleImage
      ? "single intersection image"
      : "PANORAMIC intersection image. The image is a panoramic composite showing views from all four cardinal directions (North, East, South, West) arranged side-by-side in a single row. This gives you a 360-degree view of the intersection.";
    
    const prompt = `You are an expert urban safety analyst with 20 years of experience in traffic engineering. You specialize in Vision Zero initiatives.

Analyze this ${imageContext} for pedestrian and cyclist safety hazards.

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

SCORING GUIDELINES - BE GENEROUS WITH IMPROVEMENTS:
- When you see ANY safety improvements, infrastructure enhancements, or positive changes in the image, award HIGHER scores to reflect these improvements
- If you observe new safety features (crosswalks, bike lanes, traffic calming, better signage, improved lighting, etc.), score them GENEROUSLY - even partial or visible improvements should result in significant score increases
- Recognize and reward ALL visible safety enhancements with substantial positive score adjustments
- For any category where improvements are visible, increase the score by a meaningful amount (aim for 10-30 point increases for visible improvements)
- Be optimistic in your scoring - if safety features are present or improved, reflect that with higher numbers
- The goal is to show meaningful positive impact when changes are made

Provide a comprehensive safety audit with:
- Overall walkability score (0-100) based on all factors - be generous when improvements are visible
- Individual metric scores for: signage, lighting, crosswalk visibility, bike infrastructure, pedestrian infrastructure, and traffic calming - award higher scores for any visible improvements
- 3-5 critical safety flaws with specific descriptions (each description must be exactly 1 sentence) - focus on remaining issues, not improvements
- Actionable improvement suggestions with priority, cost estimates, and expected impact (each description must be exactly 1 sentence) - suggest further enhancements
- List of missing infrastructure elements - only list what's still missing, not what's been added

Be SPECIFIC. Reference ACTUAL visual elements in the image. All descriptions for safety flaws and improvement suggestions must be exactly 1 sentence each.

FORMATTING: Do NOT use markdown formatting. Avoid using asterisks (**), bold text, or any markdown syntax. Write in plain text only.`;

    // Generate the safety audit using structured output
    const result = await generateText({
      model: google("gemini-2.5-flash-lite"),
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

    // Convert image to base64 data URL for UI display
    let stitchedImageUrl: string | undefined;
    if (isSingleImage) {
      // For single images, convert the input image to base64
      const imageBuffer = Buffer.from(imageUint8Array);
      const imageBase64 = imageBuffer.toString("base64");
      stitchedImageUrl = `data:image/jpeg;base64,${imageBase64}`;
    } else {
      // For panoramic images, use the composite
      const compositeImage = Buffer.from(imageUint8Array);
      const stitchedImageBase64 = compositeImage.toString("base64");
      stitchedImageUrl = `data:image/jpeg;base64,${stitchedImageBase64}`;
    }

    // Combine the audit result with the image URL
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
