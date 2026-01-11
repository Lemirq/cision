import clientPromise from "@/lib/mongodb";
import { clusterCollisions } from "@/lib/clustering";
import type { CollisionPoint, ClusteredHotspot } from "@/types/collision";
import { writeFileSync, mkdirSync, statSync } from "fs";
import { join } from "path";

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

// Convert MongoDB documents to CollisionPoint format (same as in route.ts)
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

async function precomputeClusters() {
  try {
    console.log("🔧 Starting cluster pre-computation...\n");
    const startTime = Date.now();

    const client = await clientPromise;
    const db = client.db("data");
    const collisionsCollection = db.collection<CollisionDocument>("collisions_2025");

    // Step 1: Fetch all collisions
    console.log("📥 Fetching all collisions from MongoDB...");
    const fetchStart = Date.now();
    const collisions = await collisionsCollection.find({}).toArray();
    const fetchTime = Date.now() - fetchStart;
    console.log(`   ✅ Fetched ${collisions.length.toLocaleString()} collisions in ${(fetchTime/1000).toFixed(2)}s\n`);

    // Step 2: Convert to CollisionPoint format
    console.log("🔄 Converting to CollisionPoint format...");
    const convertStart = Date.now();
    const collisionPoints = convertToCollisionPoints(collisions);
    const convertTime = Date.now() - convertStart;
    console.log(`   ✅ Converted ${collisionPoints.length.toLocaleString()} valid points in ${(convertTime/1000).toFixed(2)}s\n`);

    // Step 3: Cluster the collisions
    console.log("🎯 Clustering collisions (this may take a while)...");
    const clusterStart = Date.now();
    const clusters = clusterCollisions(collisionPoints);
    const clusterTime = Date.now() - clusterStart;
    console.log(`   ✅ Created ${clusters.length.toLocaleString()} clusters in ${(clusterTime/1000).toFixed(2)}s\n`);

    // Step 4: Write clusters to JSON file
    console.log("💾 Writing clusters to JSON file...");
    const writeStart = Date.now();
    
    // Use the exact ClusteredHotspot format (no computedAt field)
    const outputPath = join(process.cwd(), "data", "clusters.json");
    
    // Ensure the data directory exists
    try {
      mkdirSync(join(process.cwd(), "data"), { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }
    
    // Write clusters to JSON file
    writeFileSync(outputPath, JSON.stringify(clusters, null, 2), "utf-8");
    
    const writeTime = Date.now() - writeStart;
    const fileSize = (statSync(outputPath).size / 1024 / 1024).toFixed(2);
    
    console.log(`   ✅ Wrote ${clusters.length.toLocaleString()} clusters to JSON file`);
    console.log(`   📁 File: ${outputPath}`);
    console.log(`   📦 Size: ${fileSize} MB`);
    console.log(`   ⏱️  Write time: ${(writeTime/1000).toFixed(2)}s\n`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Cluster pre-computation complete!`);
    console.log(`   Total time: ${(totalTime/1000/60).toFixed(2)} minutes`);
    console.log(`   Total clusters: ${clusters.length.toLocaleString()}`);
    console.log(`\n💡 Clusters saved to: ${outputPath}`);
    console.log(`   You can now import this file into MongoDB or use it directly!`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error pre-computing clusters:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
    }
    process.exit(1);
  }
}

precomputeClusters();
