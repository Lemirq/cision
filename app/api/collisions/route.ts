import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createHash } from "crypto";
import clientPromise from "@/lib/mongodb";

// Next.js 16: Route segment config
// For API routes with query params, we use 'force-dynamic' but cache the data fetch with unstable_cache
// The unstable_cache handles revalidation (7 days), and we add HTTP cache headers for client/CDN caching
export const dynamic = "force-dynamic"; // Required for handling query params dynamically

interface CollisionDocument {
  OBJECTID: string;
  EVENT_UNIQUE_ID: string;
  OCC_DATE: string;
  OCC_MONTH: string;
  OCC_DOW: string;
  OCC_YEAR: string;
  OCC_HOUR: string;
  DIVISION: string;
  FATALITIES: string;
  INJURY_COLLISIONS: string;
  FTR_COLLISIONS: string;
  PD_COLLISIONS: string;
  HOOD_158: string;
  NEIGHBOURHOOD_158: string;
  LONG_WGS84: string;
  LAT_WGS84: string;
  AUTOMOBILE: string;
  MOTORCYCLE: string;
  PASSENGER: string;
  BICYCLE: string;
  PEDESTRIAN: string;
  x?: string;
  y?: string;
}

// Fetch and transform collisions data
async function fetchCollisionsData(limit: number, skip: number) {
  const client = await clientPromise;
  const db = client.db("data");
  const collection = db.collection<CollisionDocument>("collisions_2025");

  // Fetch collisions - all documents have valid coordinates, so no filter needed
  // Removing $ne: "" filter significantly improves performance (can't use indexes)
  const collisions = await collection
    .find({})
    .skip(skip)
    .limit(limit)
    .toArray();

  // Transform to GeoJSON format for Mapbox
  const features = collisions
    .filter((collision) => {
      const lat = parseFloat(collision.LAT_WGS84);
      const lng = parseFloat(collision.LONG_WGS84);
      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    })
    .map((collision) => {
      const lat = parseFloat(collision.LAT_WGS84);
      const lng = parseFloat(collision.LONG_WGS84);

      // Calculate a weight based on severity
      let weight = 1;
      if (collision.FATALITIES === "1" || collision.FATALITIES === "2") {
        weight = 3;
      } else if (collision.INJURY_COLLISIONS === "YES") {
        weight = 2;
      }

      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          id: collision.EVENT_UNIQUE_ID || collision.OBJECTID,
          objectId: collision.OBJECTID,
          eventId: collision.EVENT_UNIQUE_ID,
          date: collision.OCC_DATE,
          month: collision.OCC_MONTH,
          dayOfWeek: collision.OCC_DOW,
          year: collision.OCC_YEAR,
          hour: collision.OCC_HOUR,
          division: collision.DIVISION,
          fatalities: parseInt(collision.FATALITIES) || 0,
          injuryCollisions: collision.INJURY_COLLISIONS === "YES",
          ftrCollisions: collision.FTR_COLLISIONS === "YES",
          pdCollisions: collision.PD_COLLISIONS === "YES",
          neighbourhood: collision.NEIGHBOURHOOD_158,
          hood: collision.HOOD_158,
          automobile: collision.AUTOMOBILE === "YES",
          motorcycle: collision.MOTORCYCLE === "YES",
          passenger: collision.PASSENGER === "YES",
          bicycle: collision.BICYCLE === "YES",
          pedestrian: collision.PEDESTRIAN === "YES",
          weight, // For heatmap intensity
          lat,
          lng,
        },
      };
    });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

// Next.js 16: Use unstable_cache (still supported, though deprecated)
// This provides heavy server-side caching with automatic keying by function arguments
// Cache expires after 7 days (604800 seconds)
const getCachedCollisions = unstable_cache(
  async (limit: number, skip: number) => {
    return fetchCollisionsData(limit, skip);
  },
  ["collisions-data"], // Base cache key - differentiated by function arguments (limit, skip)
  {
    revalidate: 604800, // 7 days - data rarely changes
    tags: ["collisions"], // For manual cache invalidation with revalidateTag('collisions')
  },
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "147888"); // Default to all collisions
    const skip = parseInt(searchParams.get("skip") || "0");

    // Get cached data - unstable_cache automatically creates separate cache entries
    // based on function arguments (limit, skip), so different queries are cached separately
    const geojson = await getCachedCollisions(limit, skip);

    // Generate ETag for client-side caching validation
    const dataString = JSON.stringify(geojson);
    const etag = createHash("md5").update(dataString).digest("hex");

    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === `"${etag}"`) {
      return new NextResponse(null, {
        status: 304, // Not Modified
        headers: {
          ETag: `"${etag}"`,
          "Cache-Control":
            "public, max-age=31536000, immutable, stale-while-revalidate=2592000", // 1 year max-age, 30 days stale
        },
      });
    }

    // Heavy caching headers:
    // - max-age=604800 (7 days) - browser/CDN cache duration
    // - s-maxage=604800 (7 days) - CDN cache duration
    // - stale-while-revalidate=2592000 (30 days) - serve stale content while revalidating
    // - immutable - indicates content won't change, allows aggressive caching
    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control":
          "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000, immutable",
        ETag: `"${etag}"`,
        "Content-Type": "application/json",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("Error fetching collisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch collisions" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store", // Don't cache errors
        },
      },
    );
  }
}

// Cache invalidation:
// - Automatic: Every 7 days (604800 seconds) via revalidate option
// - Manual: Use revalidateTag('collisions') from a server action or API route
