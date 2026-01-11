import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Metric = "total" | "fatal" | "cyclist" | "pedestrian";

interface ClusterEntry {
  id: string;
  centroid: { lat: number; lng: number };
  total_count: number;
  fatal_count: number;
  cyclist_count: number;
  pedestrian_count: number;
  address: string;
  intersection: string;
  severity_score?: number;
}

interface LeaderboardRow {
  id: string;
  name: string;
  address: string;
  centroid: { lat: number; lng: number };
  total_count: number;
  fatal_count: number;
  cyclist_count: number;
  pedestrian_count: number;
  severity_score: number;
}

const cached: {
  loaded: boolean;
  byMetric: Record<Metric, LeaderboardRow[]>;
} = {
  loaded: false,
  byMetric: {
    total: [],
    fatal: [],
    cyclist: [],
    pedestrian: [],
  },
};

// Clear cache function for development (can be called via API if needed)
function clearCache() {
  cached.loaded = false;
  cached.byMetric = {
    total: [],
    fatal: [],
    cyclist: [],
    pedestrian: [],
  };
}

function toRows(data: ClusterEntry[]): LeaderboardRow[] {
  return data.map((c) => {
    // Extract severity_score - handle both the typed field and any untyped data
    const severityScore = (c as any).severity_score ?? c.severity_score ?? 0;
    return {
      id: c.id,
      name: c.intersection || c.address,
      address: c.address,
      centroid: c.centroid,
      total_count: c.total_count ?? 0,
      fatal_count: c.fatal_count ?? 0,
      cyclist_count: c.cyclist_count ?? 0,
      pedestrian_count: c.pedestrian_count ?? 0,
      severity_score: severityScore,
    };
  });
}

function sortByMetric(rows: LeaderboardRow[], metric: Metric): LeaderboardRow[] {
  const pick = (r: LeaderboardRow) => {
    switch (metric) {
      case "fatal":
        return r.fatal_count;
      case "cyclist":
        return r.cyclist_count;
      case "pedestrian":
        return r.pedestrian_count;
      default:
        return r.total_count;
    }
  };
  return [...rows].sort((a, b) => pick(b) - pick(a));
}

function isNSA(row: LeaderboardRow): boolean {
  const name = (row.name || "").trim().toLowerCase();
  const addr = (row.address || "").trim().toLowerCase();
  const nearZero =
    Math.abs(row.centroid?.lat || 0) < 1e-9 && Math.abs(row.centroid?.lng || 0) < 1e-9;
  return name === "nsa" || addr === "nsa" || nearZero;
}

async function ensureCacheLoaded() {
  if (cached.loaded) return;
  const filePath = path.join(process.cwd(), "data", "clusters.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as ClusterEntry[];
  const rows = toRows(parsed);
  cached.byMetric.total = sortByMetric(rows, "total");
  cached.byMetric.fatal = sortByMetric(rows, "fatal");
  cached.byMetric.cyclist = sortByMetric(rows, "cyclist");
  cached.byMetric.pedestrian = sortByMetric(rows, "pedestrian");
  cached.loaded = true;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metricParam = (url.searchParams.get("metric") || "total").toLowerCase() as Metric;
    const includeNSAParam = url.searchParams.get("includeNSA");
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    const metric: Metric =
      metricParam === "fatal" || metricParam === "cyclist" || metricParam === "pedestrian"
        ? metricParam
        : "total";
    const includeNSA =
      includeNSAParam === "1" ||
      includeNSAParam === "true" ||
      includeNSAParam === "yes";
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(pageSizeParam || "15", 10) || 15),
    );
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

    await ensureCacheLoaded();
    const allRows = includeNSA
      ? cached.byMetric[metric]
      : cached.byMetric[metric].filter((r) => !isNSA(r));
    const total = allRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const rows = allRows.slice(start, start + pageSize);

    return NextResponse.json(
      {
        metric,
        page,
        pageSize,
        total,
        totalPages,
        includeNSA,
        rows,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      },
    );
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}


