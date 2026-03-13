// DEMO MODE: Hard-coded response, no external API calls
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

  // Map demo place IDs to specific coordinates, default to downtown Toronto
  const placeData: Record<string, { name: string; address: string; lat: number; lng: number }> = {
    demo_place_king_bay: {
      name: "King St W & Bay St",
      address: "King St W & Bay St, Toronto, ON, Canada",
      lat: 43.6488,
      lng: -79.3812,
    },
    demo_place_queen_spadina: {
      name: "Queen St W & Spadina Ave",
      address: "Queen St W & Spadina Ave, Toronto, ON, Canada",
      lat: 43.6491,
      lng: -79.3958,
    },
    demo_place_bloor_yonge: {
      name: "Bloor St & Yonge St",
      address: "Bloor St & Yonge St, Toronto, ON, Canada",
      lat: 43.6709,
      lng: -79.3858,
    },
    demo_place_dundas_university: {
      name: "Dundas St W & University Ave",
      address: "Dundas St W & University Ave, Toronto, ON, Canada",
      lat: 43.6555,
      lng: -79.3893,
    },
  };

  const place = placeData[placeId] || {
    name: "Downtown Toronto",
    address: "Toronto, ON, Canada",
    lat: 43.6532,
    lng: -79.3832,
  };

  return NextResponse.json({
    placeId,
    name: place.name,
    address: place.address,
    location: {
      lat: place.lat,
      lng: place.lng,
    },
  });
}
