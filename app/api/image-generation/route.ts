// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, imageUrl } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Return a demo response indicating that image generation is not available
    return NextResponse.json({
      image: null,
      mediaType: null,
      text:
        "Demo mode: Image generation is not available without the Google Gemini API. " +
        "The AI would normally generate a redesigned intersection image based on your prompt: " +
        `"${prompt}". To enable this feature, configure the GOOGLE_GEMINI_API environment variable.`,
      demo: true,
    });
  } catch (error) {
    console.error("Error in image generation route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
