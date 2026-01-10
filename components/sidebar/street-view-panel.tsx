"use client";

import { useState } from "react";
import { RotateCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreetViewPanelProps {
  lat: number;
  lng: number;
}

export function StreetViewPanel({ lat, lng }: StreetViewPanelProps) {
  const [heading, setHeading] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = `/api/streetview?lat=${lat}&lng=${lng}&heading=${heading}`;

  const rotateView = () => {
    setIsLoading(true);
    setHasError(false);
    setHeading((prev) => (prev + 90) % 360);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50" : ""
      }`}
      style={isExpanded ? { backgroundColor: "#09090b" } : {}}
    >
      {isExpanded && (
        <button
          onClick={toggleExpand}
          className="absolute top-4 right-4 z-50 p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
        >
          <Minimize2 className="h-5 w-5 text-white" />
        </button>
      )}

      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse z-10" />
      )}

      {hasError ? (
        <div className={`flex items-center justify-center bg-zinc-800 text-zinc-400 ${
          isExpanded ? "h-full" : "h-48"
        }`}>
          <div className="text-center p-4">
            <p className="text-sm">Street View not available</p>
            <p className="text-xs text-zinc-500 mt-1">for this location</p>
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="Street View"
          className={`w-full object-cover transition-all duration-300 ${
            isExpanded ? "h-full" : "h-48"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={handleImageError}
        />
      )}

      <div className={`absolute bottom-3 right-3 flex gap-2 ${isExpanded ? "bottom-6 right-6" : ""}`}>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={rotateView}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        {!isExpanded && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={toggleExpand}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
