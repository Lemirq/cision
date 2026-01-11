import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createHash } from "crypto";
import clientPromise from "@/lib/mongodb";
import { clusterCollisions } from "@/lib/clustering";
import type { CollisionPoint, ClusteredHotspot } from "@/types/collision";

// Next.js 16: Route segment config
export const dynamic = 'force-dynamic';

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

// Convert MongoDB documents to CollisionPoint format
function convertToCollisionPoints(collisions: CollisionDocument[]): CollisionPoint[] {
  return collisions
    .filter((collision) => {
      const lat = parseFloat(collision.LAT_WGS84);
      const lng = parseFloat(collision.LONG_WGS84);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    })
    .map((collision) => {
      const lat = parseFloat(collision.LAT_WGS84);
      const lng = parseFloat(collision.LONG_WGS84);
      
      let weight = 1;
      if (collision.FATALITIES === "1" || collision.FATALITIES === "2") {
        weight = 3;
      } else if (collision.INJURY_COLLISIONS === "YES") {
        weight = 2;
      }

      return {
        id: collision.EVENT_UNIQUE_ID || collision.OBJECTID,
        objectId: collision.OBJECTID,
        eventId: collision.EVENT_UNIQUE_ID,
        lat,
        lng,
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
        weight,
      };
    });
}

// Fetch collisions and cluster them
async function fetchAndClusterCollisions(limit: number, skip: number): Promise<ClusteredHotspot[]> {
  const client = await clientPromise;
  const db = client.db("data");
  const collection = db.collection<CollisionDocument>("collisions_2025");

  // Fetch collisions with valid coordinates
  const collisions = await collection
    .find({
      LAT_WGS84: { $exists: true, $ne: "" },
      LONG_WGS84: { $exists: true, $ne: "" },
    })
    .skip(skip)
    .limit(limit)
    .toArray();

  // Convert to CollisionPoint format
  const collisionPoints = convertToCollisionPoints(collisions);

  // Cluster the collisions
  const clusters = clusterCollisions(collisionPoints);

  return clusters;
}

// Cache clusters (7 days)
const getCachedClusters = unstable_cache(
  async (limit: number, skip: number) => {
    return fetchAndClusterCollisions(limit, skip);
  },
  ["clusters-data"],
  {
    revalidate: 604800, // 7 days
    tags: ["clusters"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "147888");
    const skip = parseInt(searchParams.get("skip") || "0");
    
    // Get cached clusters
    const clusters = await getCachedClusters(limit, skip);

    // Generate ETag for client-side caching validation
    const dataString = JSON.stringify(clusters);
    const etag = createHash("md5").update(dataString).digest("hex");
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === `"${etag}"`) {
      return new NextResponse(null, {
        status: 304, // Not Modified
        headers: {
          "ETag": `"${etag}"`,
          "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=2592000",
        },
      });
    }

    return NextResponse.json(clusters, {
      headers: {
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000, immutable",
        "ETag": `"${etag}"`,
        "Content-Type": "application/json",
        "Vary": "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
