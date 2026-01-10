"use client";

import { useState, useRef } from "react";
import { RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoView } from "react-photo-view";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
}

export function StreetViewPanel({ lat, lng }: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Use maximum quality (640x640) for thumbnail and preview
  // Google Street View Static API maximum is 640x640 pixels
  const thumbnailUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;
  const previewUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}&size=640x640`;

  const rotateView = () => {
    setIsLoading(true);
    setHasError(false);
    setHeading((prev) => (prev + 90) % 360);
  };

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
