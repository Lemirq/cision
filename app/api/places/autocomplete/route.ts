import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get("input");

  if (!input || input.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required parameter: input" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Google Places Autocomplete API
    const autocompleteUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    autocompleteUrl.searchParams.set("input", input.trim());
    autocompleteUrl.searchParams.set("key", apiKey);
    // Don't restrict types - allow addresses, cities, establishments, etc.
    // Remove country restriction to allow global search

    const response = await fetch(autocompleteUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch autocomplete suggestions" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json({ predictions: [] });
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 400 }
      );
    }

    // Transform predictions to a cleaner format
    interface GooglePrediction {
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
      types?: string[];
    }
    const predictions = (data.predictions || []).map((prediction: GooglePrediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || "",
      types: prediction.types || [],
    }));

    return NextResponse.json(
      { predictions },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
