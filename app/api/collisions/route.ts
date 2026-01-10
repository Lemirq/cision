export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getCollisionsCollection } from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.max(
    1,
    Math.min(Number.parseInt(limitParam ?? "100", 10) || 100, 1000)
  );
  const collection = await getCollisionsCollection("collisions_2025");
  const data = await collection.find({}).limit(limit).toArray();

  return NextResponse.json({ data });
}


