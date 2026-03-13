// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing required parameters: lat and lng" },
      { status: 400 }
    );
  }

  const placeInfo = {
    address: "301 Front St W, Toronto, ON M5V 2T6, Canada",
    streetNumber: "301",
    streetName: "Front St W",
    neighborhood: "CityPlace",
    city: "Toronto",
    province: "Ontario",
    postalCode: "M5V 2T6",
    country: "Canada",
    placeId: "demo_place_id_reverse_geocode",
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    },
    types: ["street_address"],
    formattedAddress: "301 Front St W, Toronto, ON M5V 2T6, Canada",
  };

  return NextResponse.json(placeInfo, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
