import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import sharp from "sharp";

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

    // Handle both regular URLs and data URLs (base64)
    let imageBuffer: ArrayBuffer;
    let contentType: string;
    let imageUint8Array: Uint8Array;

    if (imageUrl.startsWith("data:")) {
      // Handle data URL (base64)
      const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json(
          { error: "Invalid data URL format" },
          { status: 400 }
        );
      }
      contentType = base64Match[1];
      const base64Data = base64Match[2];
      imageBuffer = Buffer.from(base64Data, "base64").buffer;
      imageUint8Array = new Uint8Array(imageBuffer);
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
      imageUint8Array = new Uint8Array(imageBuffer);
      contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    // Get original image dimensions for resizing the generated image
    let originalWidth: number;
    let originalHeight: number;
    try {
      const metadata = await sharp(Buffer.from(imageBuffer)).metadata();
      originalWidth = metadata.width || 1280;
      originalHeight = metadata.height || 1280;
    } catch {
      // Fallback dimensions if we can't read metadata
      originalWidth = 1280;
      originalHeight = 1280;
    }

    // Get API key from environment (supports GOOGLE_GEMINI_API and GOOGLE_GENERATIVE_AI_API_KEY)
    const apiKey = process.env.GOOGLE_GEMINI_API || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured. Please set GOOGLE_GEMINI_API or GOOGLE_GENERATIVE_AI_API_KEY in your environment." },
        { status: 500 }
      );
    }

    // Set the API key for the Google provider (it reads from GOOGLE_GENERATIVE_AI_API_KEY by default)
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    // System instructions for the AI agent
    const systemInstruction = `You are an AI agent specialized in redefining and improving intersections for better safety and urban design. When given a street view image of an intersection and a user's prompt, generate a new image that reimagines the intersection according to the user's instructions. Focus on safety improvements, better traffic flow, pedestrian-friendly design, and modern urban planning principles.`;

    // Generate the image using Gemini 2.5 Flash Image
    const result = await generateText({
      model: google("gemini-2.5-flash-image"),
      system: systemInstruction,
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
              mediaType: contentType,
            },
          ],
        },
      ],
    });

    // Extract generated images from the result
    const generatedImages: Array<{
      data: Uint8Array;
      mediaType: string;
    }> = [];

    for (const file of result.files || []) {
      if (file.mediaType.startsWith("image/")) {
        generatedImages.push({
          data: file.uint8Array,
          mediaType: file.mediaType,
        });
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: "No image was generated" },
        { status: 500 }
      );
    }

    // Resize the generated image to match the original dimensions
    const imageData = generatedImages[0];
    let resizedImageBuffer: Buffer;
    let finalMediaType = imageData.mediaType;

    try {
      resizedImageBuffer = await sharp(imageData.data)
        .resize(originalWidth, originalHeight, {
          fit: "fill",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();
      
      // Ensure we maintain the same format as the original
      if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        resizedImageBuffer = await sharp(resizedImageBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        finalMediaType = "image/jpeg";
      } else if (contentType.includes("png")) {
        resizedImageBuffer = await sharp(resizedImageBuffer)
          .png()
          .toBuffer();
        finalMediaType = "image/png";
      }
    } catch {
      // Fallback to original generated image if resize fails
      resizedImageBuffer = Buffer.from(imageData.data);
    }

    // Convert the resized image to base64 for easy transmission
    const base64Image = resizedImageBuffer.toString("base64");
    const dataUrl = `data:${finalMediaType};base64,${base64Image}`;

    return NextResponse.json({
      image: dataUrl,
      mediaType: finalMediaType,
      text: result.text || "Image generated successfully",
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
