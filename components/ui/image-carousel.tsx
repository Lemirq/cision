"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ImageCarouselItem {
  id: string;
  imgUrl: string;
  isOriginal?: boolean;
}

interface ImageCarouselProps {
  images: ImageCarouselItem[];
  onRevert?: (imageId: string) => void;
  onSelect?: (imageId: string) => void;
  selectedImageId?: string;
  cardsPerView?: number;
}

export function ImageCarousel({
  images,
  onRevert,
  onSelect,
  selectedImageId,
  cardsPerView = 3,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fixed width for each thumbnail (64px + 4px gap = 68px per item)
  const thumbnailWidth = 68;

  const nextSlide = () => {
    if (isAnimating || !images || images.length <= cardsPerView) return;

    setIsAnimating(true);
    const nextIndex = (currentIndex + 1) % images.length;

    if (containerRef.current) {
      containerRef.current.style.transition = "transform 300ms ease";
      containerRef.current.style.transform = `translateX(-${thumbnailWidth}px)`;

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        if (containerRef.current) {
          containerRef.current.style.transition = "none";
          containerRef.current.style.transform = "translateX(0)";
          void containerRef.current.offsetWidth;
          setIsAnimating(false);
        }
      }, 300);
    }
  };

  const prevSlide = () => {
    if (isAnimating || !images || images.length <= cardsPerView) return;

    setIsAnimating(true);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;

    if (containerRef.current) {
      containerRef.current.style.transition = "none";
      containerRef.current.style.transform = `translateX(-${thumbnailWidth}px)`;
      setCurrentIndex(prevIndex);
      void containerRef.current.offsetWidth;
      containerRef.current.style.transition = "transform 300ms ease";
      containerRef.current.style.transform = "translateX(0)";

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  // Calculate which images to show
  const getVisibleImages = () => {
    if (!images || images.length === 0) return [];

    if (images.length <= cardsPerView) {
      return images;
    }

    const visibleImages = [];
    const totalImages = images.length;

    for (let i = 0; i < cardsPerView + 1; i++) {
      const index = (currentIndex + i) % totalImages;
      visibleImages.push(images[index]);
    }

    return visibleImages;
  };

  if (!images || images.length === 0) {
    return null;
  }

  const visibleImages = getVisibleImages();
  const showControls = images.length > cardsPerView;

  return (
    <div className="w-full relative max-w-md mx-auto">
      {showControls && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={isAnimating}
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={isAnimating}
            aria-label="Next slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div className="overflow-hidden rounded-lg">
        <div
          ref={containerRef}
          className="flex gap-1"
          style={{
            transform: "translateX(0)",
          }}
        >
          {visibleImages.map((image, idx) => {
            const isSelected = selectedImageId === image.id;
            return (
              <div
                key={`image-${currentIndex}-${idx}-${image.id}`}
                className="flex-shrink-0"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded border transition-all duration-300 group cursor-pointer",
                    isSelected
                      ? "border-blue-500 ring-1 ring-blue-500/50"
                      : "border-zinc-700 hover:border-zinc-600"
                  )}
                  onClick={() => onSelect?.(image.id)}
                  style={{ width: "64px", height: "64px" }}
                >
                  <div className="w-full h-full bg-zinc-900">
                    <img
                      src={image.imgUrl}
                      alt={image.isOriginal ? "Original image" : "Generated image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Active
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
