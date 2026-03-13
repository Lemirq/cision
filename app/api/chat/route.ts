// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest } from "next/server";
import { UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      imageUrl,
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

    // Determine a contextual demo response based on the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const userText =
      lastUserMessage?.parts?.find((p) => p.type === "text")?.text || "";

    let demoResponse =
      "This is a demo mode response. The AI chat feature is currently running without external API calls. " +
      "The intersection appears to have standard safety infrastructure including crosswalks and traffic signals. " +
      "To enable full AI-powered analysis and image generation, configure the Google Gemini API key.";

    if (
      userText.toLowerCase().includes("bike") ||
      userText.toLowerCase().includes("cycling")
    ) {
      demoResponse =
        "This is a demo mode response. Based on your request about cycling infrastructure, " +
        "the intersection could benefit from protected bike lanes with physical barriers such as bollards or planters, " +
        "green-painted lane markings, and dedicated cyclist signal phases. " +
        "To generate an actual redesigned image, enable the Google Gemini API.";
    } else if (
      userText.toLowerCase().includes("crosswalk") ||
      userText.toLowerCase().includes("pedestrian")
    ) {
      demoResponse =
        "This is a demo mode response. Regarding pedestrian improvements, " +
        "the intersection could benefit from raised crosswalks with high-visibility markings, " +
        "pedestrian refuge islands, and extended crossing times at signals. " +
        "To generate an actual redesigned image, enable the Google Gemini API.";
    }

    // Format as AI SDK v6 UI message stream protocol
    // Compatible with DefaultChatTransport from @ai-sdk/react useChat
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Text delta part
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "text", value: demoResponse }) + "\n"
          )
        );
        // Step finish part
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "step-finish",
              value: {
                finishReason: "stop",
                usage: { promptTokens: 0, completionTokens: 0 },
                isContinued: false,
              },
            }) + "\n"
          )
        );
        // Finish part
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "finish",
              value: {
                finishReason: "stop",
                usage: { promptTokens: 0, completionTokens: 0 },
              },
            }) + "\n"
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-UI-Message-Stream": "v1",
      },
    });
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
