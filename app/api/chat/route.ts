import { NextRequest } from "next/server";
import { convertToModelMessages, streamText, generateText, UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import sharp from "sharp";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      imageUrl,
      clusterId,
      context,
    }: {
      messages: UIMessage[];
      imageUrl?: string;
      clusterId?: string;
      context?: string;
    } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get API key from environment
    const apiKey =
      process.env.GOOGLE_GEMINI_API || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Google Gemini API key not configured. Please set GOOGLE_GEMINI_API or GOOGLE_GENERATIVE_AI_API_KEY in your environment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set the API key for the Google provider
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    // Build system prompt with context if available
    let systemPrompt = `You are an AI agent specialized in redefining and improving intersections for better safety and urban design. 
You help users reimagine intersections by generating new images based on their requests. 
When a user asks you to modify or improve an intersection, use the generateImage tool to create a new visualization.

Guidelines for image generation:
- Be specific and detailed in your prompts. Include visual details like colors, materials, lane markings, signage, and physical barriers.
- For bike lanes: Specify if they should be protected (with physical barriers like bollards, planters, or curbs), painted (with colored pavement), or separated. Mention colors like green, blue, or red for painted lanes.
- For crosswalks: Mention if they should be raised, have high-visibility markings, or include pedestrian islands.
- For traffic calming: Specify elements like speed bumps, chicanes, roundabouts, or narrowed lanes.
- If a generation doesn't work as expected, try again with a different approach or more specific details.
- Always explain what improvements you're making and why they enhance safety.

Be conversational, helpful, and explain what improvements you're making when generating images.`;

    // Add cluster context if available
    if (context && context.trim()) {
      systemPrompt += `\n\nCONTEXT ABOUT THIS INTERSECTION:\n${context}\n\nUse this context to provide informed, context-aware responses. If you see that the user has made recent improvements (like adding bike lanes or crosswalks), acknowledge those improvements positively and suggest additional enhancements based on the safety audit findings.`;
    }

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        generateImage: {
          description:
            "Generate a new image that reimagines the intersection based on the user's request. Use this tool when the user wants to modify, improve, or redesign the intersection shown in the street view image.",
          inputSchema: z.object({
            prompt: z
              .string()
              .describe(
                "A detailed, specific description of how to modify the intersection. Include visual details like: colors (green/blue/red for bike lanes), materials (concrete barriers, bollards, planters), lane markings, signage, physical barriers, raised elements, and specific design elements. Be very specific about bike lane protection (physical barriers vs painted lanes), crosswalk types (raised, high-visibility), and traffic calming measures."
              ),
          }),
          execute: async ({ prompt }) => {
            try {
              // Handle both regular URLs and data URLs (base64)
              let imageBuffer: ArrayBuffer;
              let contentType: string;
              let imageUint8Array: Uint8Array;

              if (imageUrl.startsWith("data:")) {
                // Handle data URL (base64)
                const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!base64Match) {
                  throw new Error("Invalid data URL format");
                }
                contentType = base64Match[1];
                const base64Data = base64Match[2];
                imageBuffer = Buffer.from(base64Data, "base64").buffer;
                imageUint8Array = new Uint8Array(imageBuffer);
              } else {
                // Convert relative URLs to absolute URLs
                let absoluteImageUrl = imageUrl;
                if (imageUrl.startsWith("/")) {
                  // Relative URL - need to construct absolute URL
                  try {
                    // Use NextRequest's nextUrl to get the origin
                    const origin = req.nextUrl.origin;
                    absoluteImageUrl = `${origin}${imageUrl}`;
                  } catch {
                    // Fallback to environment variable or headers
                    const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
                    const host = process.env.NEXT_PUBLIC_APP_URL 
                      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
                      : req.headers.get("host") || "localhost:3000";
                    absoluteImageUrl = `${protocol}://${host}${imageUrl}`;
                  }
                }

                // Handle regular URL
                const imageResponse = await fetch(absoluteImageUrl);
                if (!imageResponse.ok) {
                  throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
                }
                imageBuffer = await imageResponse.arrayBuffer();
                imageUint8Array = new Uint8Array(imageBuffer);
                contentType =
                  imageResponse.headers.get("content-type") || "image/jpeg";
              }

              // Get original image dimensions for resizing the generated image
              let originalWidth: number;
              let originalHeight: number;
              try {
                const metadata = await sharp(
                  Buffer.from(imageBuffer)
                ).metadata();
                originalWidth = metadata.width || 1280;
                originalHeight = metadata.height || 1280;
              } catch (error) {
                // Fallback dimensions if we can't read metadata
                originalWidth = 1280;
                originalHeight = 1280;
              }

              // Generate the image using Gemini 2.5 Flash Image
              const generateResult = await generateText({
                model: google("gemini-2.5-flash-image"),
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

              // Get the generated image from the result
              const generatedImages: Array<{
                data: Uint8Array;
                mediaType: string;
              }> = [];

              for (const file of generateResult.files || []) {
                if (file.mediaType.startsWith("image/")) {
                  generatedImages.push({
                    data: file.uint8Array,
                    mediaType: file.mediaType,
                  });
                }
              }

              if (generatedImages.length === 0) {
                throw new Error("No image was generated");
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
              } catch (resizeError) {
                console.error("Error resizing image:", resizeError);
                // Fallback to original generated image if resize fails
                resizedImageBuffer = Buffer.from(imageData.data);
              }

              // Convert the resized image to base64 for easy transmission
              const base64Image = resizedImageBuffer.toString("base64");
              const dataUrl = `data:${finalMediaType};base64,${base64Image}`;

              return {
                success: true,
                image: dataUrl,
                mediaType: finalMediaType,
                message: "Image generated successfully",
              };
            } catch (error) {
              console.error("Error generating image:", error);
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate image",
              };
            }
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
