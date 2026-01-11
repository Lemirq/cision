"use client";

import { useState, useEffect } from "react";
import { RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoView } from "react-photo-view";
import { motion, AnimatePresence } from "framer-motion";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
  date?: string; // Date of the crash (YYYY-MM-DD format or YYYY-MM)
  hour?: string; // Hour of the crash (0-23)
  year?: string;
  month?: string;
  replacedImageUrl?: string | null; // Generated image to replace the street view
}

export function StreetViewPanel({
  lat,
  lng,
  date,
  hour,
  year,
  month,
  replacedImageUrl,
}: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showShine, setShowShine] = useState(false);

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
  const originalUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640${dateParam}`;
  const displayUrl = replacedImageUrl || originalUrl;

  const rotateView = () => {
    setIsLoading(true);
    setHasError(false);
    setHeading((prev) => (prev + 90) % 360);
  };

  // Update image URL when date or hour changes
  useEffect(() => {
    setIsLoading(() => true);
    setHasError(() => false);
  }, [date, hour, year, month, lat, lng]);

  // Trigger shine animation when image is replaced
  useEffect(() => {
    if (!replacedImageUrl) {
      return;
    }
    
    setIsLoading(true);
    setShowShine(true);
    
    // Reset shine after animation completes
    const timer = setTimeout(() => {
      setShowShine(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [replacedImageUrl]);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Find and click the image element to open PhotoView
    const imgElement = document.querySelector(
      `img[src="${displayUrl}"]`
    ) as HTMLImageElement;
    if (imgElement) {
      imgElement.click();
    }
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative overflow-hidden">
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
        <div className="relative">
          <PhotoView src={displayUrl}>
            <img
              src={displayUrl}
              alt={replacedImageUrl ? "Redesigned Intersection" : "Street View"}
              className={`w-full h-64 object-cover cursor-pointer ${
                replacedImageUrl
                  ? "animate-in fade-in zoom-in duration-500"
                  : ""
              }`}
              onLoad={() => setIsLoading(false)}
              onError={handleImageError}
              onClick={(e) => {
                // Prevent click from closing PhotoView
                e.stopPropagation();
              }}
            />
          </PhotoView>

          {/* Shine effect overlay */}
          <AnimatePresence>
            {showShine && replacedImageUrl && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-20"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                  transform: "skewX(-20deg)",
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        {!replacedImageUrl && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={rotateView}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
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
