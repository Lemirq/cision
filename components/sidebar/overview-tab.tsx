"use client";

import { useState } from "react";
import { StreetViewPanel } from "./street-view-panel";
import { StatsGrid } from "./stats-grid";
import { SeverityProgressBar } from "./severity-progress-bar";
import type {
  ClusteredHotspot,
  CollisionPoint,
  PlaceInfo,
} from "@/types/collision";
import {
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  Car,
  Bike,
  User,
  Users,
} from "lucide-react";

interface OverviewTabProps {
  hotspot: ClusteredHotspot;
  collision?: CollisionPoint | null;
  placeInfo?: PlaceInfo | null;
  onImageReplaced?: (imageUrl: string | null) => void; // Callback when image is replaced
  currentImageUrl?: string | null; // Current displayed image URL
  carouselImages?: Array<{ id: string; imgUrl: string; isOriginal: boolean }>;
  selectedImageId?: string;
  onRevertImage?: (imageId: string) => void;
  onSelectImage?: (imageId: string) => void;
}

export function OverviewTab({
  hotspot,
  collision,
  placeInfo,
  onImageReplaced,
  currentImageUrl,
  carouselImages = [],
  selectedImageId,
  onRevertImage,
  onSelectImage,
}: OverviewTabProps) {
  const displayAddress = placeInfo?.formattedAddress || hotspot.address;
  const displayLocation =
    placeInfo?.neighborhood ||
    collision?.neighbourhood ||
    "Intersection location";


  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-zinc-500 mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="text-white font-medium wrap-break-word">
            {displayAddress}
          </p>
          <p className="text-sm text-zinc-500">{displayLocation}</p>
          {collision && collision.division && (
            <p className="text-xs text-zinc-600 mt-1">
              Division: {collision.division}
            </p>
          )}
        </div>
      </div>

      <StreetViewPanel
        lat={hotspot.centroid.lat}
        lng={hotspot.centroid.lng}
        date={collision?.date}
        hour={collision?.hour}
        year={collision?.year}
        month={collision?.month}
        replacedImageUrl={currentImageUrl}
      />

      {/* Show cluster information if it's a cluster (multiple collisions) */}
      {!collision && hotspot.total_count > 1 && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <button
            onClick={() => {
              // Find and click the street view image to open PhotoView
              const image = document.querySelector('img[alt="Street View"], img[alt="Redesigned Intersection"]');
              if (image) {
                (image as HTMLElement).click();
              }
            }}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-green-600/20 hover:shadow-green-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            FIX
          </button>

          {/* Date range for cluster */}
          {hotspot.collisions && hotspot.collisions.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Date Range</p>
                <p className="text-sm text-white">
                  {(() => {
                    const dates = hotspot.collisions
                      .map((c: CollisionPoint) => {
                        if (c.year && c.month) {
                          return `${c.month} ${c.year}`;
                        }
                        // Remove time portion from date string if present
                        return c.date ? c.date.split(" ")[0] : "";
                      })
                      .filter(Boolean)
                      .sort();
                    if (dates.length === 0) return "Unknown";
                    if (dates.length === 1) return dates[0];
                    return `${dates[0]} - ${dates[dates.length - 1]}`;
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show collision details if it's a single collision */}
      {collision && (
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className={`h-4 w-4 ${
                collision.fatalities > 0
                  ? "text-red-400"
                  : collision.injuryCollisions
                    ? "text-amber-400"
                    : "text-blue-400"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  collision.fatalities > 0
                    ? "text-red-400"
                    : collision.injuryCollisions
                      ? "text-amber-400"
                      : "text-blue-400"
                }`}
              >
                {collision.fatalities > 0
                  ? `Fatal - ${collision.fatalities} fatality${collision.fatalities > 1 ? "ies" : ""}`
                  : collision.injuryCollisions
                    ? "Injury Collision"
                    : collision.pdCollisions
                      ? "Property Damage"
                      : "Minor Collision"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Date</p>
                <p className="text-sm text-white">
                  {collision.date
                    ? (() => {
                        // Remove time portion from date string (e.g., "5/16/2025 4:00:00 AM" -> "5/16/2025")
                        const dateOnly = collision.date.split(" ")[0];
                        return dateOnly;
                      })()
                    : `${collision.month} ${collision.year}`}
                </p>
                {collision.dayOfWeek && (
                  <p className="text-xs text-zinc-500">{collision.dayOfWeek}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500">Time</p>
                <p className="text-sm text-white">
                  {collision.hour ? `${collision.hour}:00` : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Types Involved */}
          {(collision.automobile ||
            collision.motorcycle ||
            collision.bicycle ||
            collision.pedestrian ||
            collision.passenger) && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">
                Vehicles & Road Users
              </p>
              <div className="flex flex-wrap gap-2">
                {collision.automobile && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <Car className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Auto</span>
                  </div>
                )}
                {collision.motorcycle && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <Bike className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Motorcycle</span>
                  </div>
                )}
                {collision.bicycle && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <Bike className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Bicycle</span>
                  </div>
                )}
                {collision.pedestrian && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <User className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Pedestrian</span>
                  </div>
                )}
                {collision.passenger && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800">
                    <Users className="h-3 w-3 text-zinc-400" />
                    <span className="text-xs text-zinc-300">Passenger</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <StatsGrid hotspot={hotspot} />

      <SeverityProgressBar score={hotspot.severity_score} />
    </div>
  );
}
