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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Reverse geocoding to get address and place details
    const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    const response = await fetch(reverseGeocodeUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch place information" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        { error: "No address found for this location" },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Geocoding API error: ${data.status}` },
        { status: 400 }
      );
    }

    // Extract relevant information
    const result = data.results[0];
    const address = result.formatted_address;
    
    // Extract address components
    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }
    const addressComponents: AddressComponent[] = result.address_components || [];
    const getComponent = (types: string[]) => {
      const component = addressComponents.find((comp: AddressComponent) =>
        types.some((type) => comp.types.includes(type))
      );
      return component?.long_name || "";
    };

    const placeInfo = {
      address,
      streetNumber: getComponent(["street_number"]),
      streetName: getComponent(["route"]),
      neighborhood: getComponent(["neighborhood", "sublocality"]),
      city: getComponent(["locality", "administrative_area_level_2"]),
      province: getComponent(["administrative_area_level_1"]),
      postalCode: getComponent(["postal_code"]),
      country: getComponent(["country"]),
      placeId: result.place_id,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      types: result.types || [],
      formattedAddress: address,
    };

    return NextResponse.json(placeInfo, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error fetching place information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
