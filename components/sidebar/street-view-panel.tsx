"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoView } from "react-photo-view";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
  date?: string; // Date of the crash (YYYY-MM-DD format or YYYY-MM)
  hour?: string; // Hour of the crash (0-23)
  year?: string;
  month?: string;
}

export function StreetViewPanel({ lat, lng, date, hour, year, month }: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Construct date parameter for Google Street View API
  // Format: YYYY-MM or YYYY-MM-DD
  // Using historical imagery from the crash date helps get imagery closer to that time
  const formatDateParam = (): string => {
    if (date) {
      // Try to parse and normalize the date format
      // Handle formats like "2023-10-15", "10/15/2023", "2023-10", etc.
      const dateMatch = date.match(/(\d{4})[-\/](\d{1,2})[-\/]?(\d{1,2})?/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const monthNum = month.padStart(2, "0");
        if (day) {
          const dayNum = day.padStart(2, "0");
          return `${year}-${monthNum}-${dayNum}`;
        }
        return `${year}-${monthNum}`;
      }
      // If it's already in YYYY-MM or YYYY-MM-DD format, use it directly
      if (date.match(/^\d{4}-\d{2}(-\d{2})?$/)) {
        return date;
      }
    }
    
    // Fall back to constructing from year and month
    if (year && month) {
      const monthNum = month.padStart(2, "0");
      return `${year}-${monthNum}`;
    }
    
    return "";
  };

  const formattedDate = formatDateParam();
  const dateParam = formattedDate ? `&date=${formattedDate}` : "";

  // Use maximum quality (640x640) for thumbnail and preview
  // Google Street View Static API maximum is 640x640 pixels
  // Note: While Google Street View API doesn't directly control day/night,
  // using the date parameter requests historical imagery from that time period,
  // which may naturally reflect the time conditions when available
  const thumbnailUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640${dateParam}`;
  const previewUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640${dateParam}`;

  const rotateView = () => {
    setIsLoading(true);
    setHasError(false);
    setHeading((prev) => (prev + 90) % 360);
  };

  // Update image URL when date or hour changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [date, hour, year, month, lat, lng]);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageRef.current) {
      imageRef.current.click();
    }
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse z-10" />
      )}

      {hasError ? (
        <div className="flex items-center justify-center bg-zinc-800 text-zinc-400 h-48">
          <div className="text-center p-4">
            <p className="text-sm">Street View not available</p>
            <p className="text-xs text-zinc-500 mt-1">for this location</p>
          </div>
        </div>
      ) : (
        <PhotoView src={previewUrl}>
          <img
            ref={imageRef}
            src={thumbnailUrl}
            alt="Street View"
            className="w-full h-64 object-cover cursor-pointer"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
          />
        </PhotoView>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={rotateView}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        {!hasError && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={handleExpand}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
