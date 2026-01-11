import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json(
      { error: "Missing required parameter: place_id" },
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
    // Google Places Details API
    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("fields", "geometry,formatted_address,name,place_id");

    const response = await fetch(detailsUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch place details" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.result;
    const location = result.geometry?.location;

    if (!location) {
      return NextResponse.json(
        { error: "No location found for this place" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      placeId: result.place_id,
      name: result.name || result.formatted_address,
      address: result.formatted_address,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
    });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
