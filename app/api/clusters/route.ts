import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import type { ClusteredHotspot } from "@/types/collision";

// Next.js 16: Route segment config
export const dynamic = 'force-dynamic';

// Fetch pre-computed clusters from JSON file
async function fetchPrecomputedClusters(): Promise<ClusteredHotspot[]> {
  const filePath = join(process.cwd(), "data", "clusters.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const clusters: ClusteredHotspot[] = JSON.parse(fileContent);
  return clusters;
}

// Cache clusters (7 days) - reads from JSON file
const getCachedClusters = unstable_cache(
  async () => {
    return fetchPrecomputedClusters();
  },
  ["precomputed-clusters-json"],
  {
    revalidate: 604800, // 7 days
    tags: ["clusters"],
  }
);

export async function GET(request: NextRequest) {
  try {
    // Note: limit and skip are ignored now since we fetch pre-computed clusters
    // All clusters are pre-computed and stored in the JSON file
    
    // Get cached pre-computed clusters
    const clusters = await getCachedClusters();

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
