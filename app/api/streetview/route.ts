import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const heading = searchParams.get("heading") || "0";
  const sizeParam = searchParams.get("size") || "640x640";

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

  // Use maximum allowed size (640x640) or custom size from parameter
  // Google Street View Static API maximum is 640x640 pixels
  // scale=2 doubles the resolution (640x640 becomes 1280x1280)
  const size = sizeParam;
  const fov = "90";
  const pitch = "0";
  const scale = "2";

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&fov=${fov}&pitch=${pitch}&scale=${scale}&key=${apiKey}`;

  try {
    const response = await fetch(streetViewUrl);

    if (!response.ok) {
      console.error("Street View API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch street view image" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    // Google Street View API can return errors as JSON, HTML, or plain text
    // Check if it's an error response by looking at content-type or reading first bytes
    if (contentType.includes("application/json") || contentType.includes("text/html") || contentType.includes("text/plain")) {
      const errorData = await response.text();
      console.error("Street View API returned error:", errorData.substring(0, 500));
      
      // Check for specific error messages
      if (errorData.includes("API key") || errorData.includes("invalid")) {
        return NextResponse.json(
          { error: "Invalid API key or Street View Static API not enabled" },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: "Street View not available for this location" },
        { status: 404 }
      );
    }

    // If it's an image, return it
    if (contentType.includes("image/")) {
      const imageBuffer = await response.arrayBuffer();
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Fallback: try to read as buffer and check if it's actually an image
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Check for JPEG/PNG magic bytes
    const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8;
    const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50;
    
    if (isJPEG || isPNG) {
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // If we get here, it's likely an error response
    const textResponse = new TextDecoder().decode(buffer);
    console.error("Unexpected Street View API response:", textResponse.substring(0, 200));
    return NextResponse.json(
      { error: "Street View not available for this location" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching street view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
