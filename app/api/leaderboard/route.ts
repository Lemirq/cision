// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";

type Metric = "total" | "fatal" | "cyclist" | "pedestrian";

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

const demoRows: LeaderboardRow[] = [
  { id: "cluster-1", name: "Queen St W & University Ave", address: "Queen St W & University Ave", centroid: { lat: 43.65535, lng: -79.38385 }, total_count: 25, fatal_count: 2, cyclist_count: 3, pedestrian_count: 5, severity_score: 8.5 },
  { id: "cluster-6", name: "King St W & Bathurst St", address: "King St W & Bathurst St", centroid: { lat: 43.64870, lng: -79.39566 }, total_count: 22, fatal_count: 2, cyclist_count: 1, pedestrian_count: 7, severity_score: 7.9 },
  { id: "cluster-4", name: "Dundas St E & Parliament St", address: "Dundas St E & Parliament St", centroid: { lat: 43.65457, lng: -79.36084 }, total_count: 20, fatal_count: 1, cyclist_count: 4, pedestrian_count: 6, severity_score: 6.3 },
  { id: "cluster-2", name: "Lake Shore Blvd W & Spadina Ave", address: "Lake Shore Blvd W & Spadina Ave", centroid: { lat: 43.64318, lng: -79.38014 }, total_count: 18, fatal_count: 0, cyclist_count: 6, pedestrian_count: 3, severity_score: 5.1 },
  { id: "cluster-5", name: "College St & Spadina Ave", address: "College St & Spadina Ave", centroid: { lat: 43.66109, lng: -79.39461 }, total_count: 14, fatal_count: 0, cyclist_count: 3, pedestrian_count: 2, severity_score: 4.0 },
  { id: "cluster-0", name: "Bloor St W & Spadina Ave", address: "Bloor St W & Spadina Ave", centroid: { lat: 43.66666, lng: -79.40381 }, total_count: 12, fatal_count: 0, cyclist_count: 2, pedestrian_count: 1, severity_score: 3.2 },
  { id: "cluster-3", name: "Yonge St & Bloor St", address: "Yonge St & Bloor St", centroid: { lat: 43.67183, lng: -79.38656 }, total_count: 9, fatal_count: 0, cyclist_count: 1, pedestrian_count: 2, severity_score: 2.8 },
  { id: "cluster-7", name: "Bathurst St & Dupont St", address: "Bathurst St & Dupont St", centroid: { lat: 43.67720, lng: -79.41464 }, total_count: 7, fatal_count: 0, cyclist_count: 0, pedestrian_count: 1, severity_score: 1.5 },
  { id: "cluster-8", name: "Dufferin St & Bloor St W", address: "Dufferin St & Bloor St W", centroid: { lat: 43.66020, lng: -79.43540 }, total_count: 6, fatal_count: 0, cyclist_count: 1, pedestrian_count: 0, severity_score: 1.2 },
  { id: "cluster-9", name: "Ossington Ave & Queen St W", address: "Ossington Ave & Queen St W", centroid: { lat: 43.64620, lng: -79.42040 }, total_count: 5, fatal_count: 0, cyclist_count: 2, pedestrian_count: 1, severity_score: 1.0 },
];

function sortByMetric(rows: LeaderboardRow[], metric: Metric): LeaderboardRow[] {
  const pick = (r: LeaderboardRow) => {
    switch (metric) {
      case "fatal": return r.fatal_count;
      case "cyclist": return r.cyclist_count;
      case "pedestrian": return r.pedestrian_count;
      default: return r.total_count;
    }
  };
  return [...rows].sort((a, b) => pick(b) - pick(a));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const metricParam = (url.searchParams.get("metric") || "total").toLowerCase() as Metric;
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");

  const metric: Metric =
    metricParam === "fatal" || metricParam === "cyclist" || metricParam === "pedestrian"
      ? metricParam
      : "total";

  const pageSize = Math.max(1, Math.min(100, parseInt(pageSizeParam || "15", 10) || 15));
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const sorted = sortByMetric(demoRows, metric);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  return NextResponse.json(
    {
      metric,
      page,
      pageSize,
      total,
      totalPages,
      includeNSA: false,
      rows,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
