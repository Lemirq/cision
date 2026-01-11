"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useMapStore } from "@/stores/map-store";
import { X } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { PhotoProvider } from "react-photo-view";
import { ImageChatSidebar } from "./image-chat-sidebar";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { ClusteredHotspot } from "@/types/collision";

interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
}

function PhotoViewOverlay({ 
  imageSrc, 
  onImageReplaced,
  onClose,
  currentImageUrl,
  carouselImages,
  selectedImageId,
  onRevertImage,
  onSelectImage,
}: { 
  imageSrc?: string;
  onImageReplaced?: (imageUrl: string | null) => void;
  onClose?: () => void;
  currentImageUrl?: string | null;
  carouselImages?: Array<{ id: string; imgUrl: string; isOriginal: boolean }>;
  selectedImageId?: string;
  onRevertImage?: (imageId: string) => void;
  onSelectImage?: (imageId: string) => void;
}) {
  useEffect(() => {
    document.body.classList.add("photo-view-open");
    
    // Force toolbar and overlay to stay visible
    const forceVisibility = () => {
      const toolbars = document.querySelectorAll('[class*="PhotoView__PhotoViewToolbar"]');
      toolbars.forEach((toolbar) => {
        const el = toolbar as HTMLElement;
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'flex';
      });
    };

    // Prevent PhotoView from hiding toolbar/overlay on image click
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.PhotoView__PhotoViewImage')) {
        e.stopPropagation();
        forceVisibility();
      }
    };

    // Prevent PhotoView from hiding elements on any click within the image area
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.PhotoView__PhotoViewImage') || 
          target.closest('.PhotoView__PhotoViewContent')) {
        forceVisibility();
      }
    };

    // Use mutation observer to keep toolbar visible
    const observer = new MutationObserver(() => {
      forceVisibility();
    });

    // Observe changes to PhotoView elements
    const observePhotoView = () => {
      const photoView = document.querySelector('[class*="PhotoView__PhotoView"]');
      if (photoView) {
        observer.observe(photoView, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          subtree: true,
        });
      }
    };

    // Initial force
    forceVisibility();
    
    // Observe after a short delay to ensure PhotoView is rendered
    const timeoutId = setTimeout(observePhotoView, 100);

    document.addEventListener('click', handleClick, true);
    document.addEventListener('click', handleImageClick, true);

    // Keep forcing visibility periodically
    const intervalId = setInterval(forceVisibility, 100);

    return () => {
      document.body.classList.remove("photo-view-open");
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('click', handleImageClick, true);
      observer.disconnect();
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Use current image if available, otherwise use original imageSrc
  const displayImageSrc = currentImageUrl || imageSrc;

  return (
    <>
      <ImageChatSidebar 
        imageSrc={displayImageSrc} 
        onImageReplaced={onImageReplaced} 
        onClose={onClose} 
      />
      {carouselImages && carouselImages.length > 0 && (
        <ImageCarouselOverlay
          images={carouselImages}
          selectedImageId={selectedImageId || "original"}
          onRevert={onRevertImage}
          onSelect={onSelectImage}
        />
      )}
    </>
  );
}

function ImageCarouselOverlay({
  images,
  selectedImageId,
  onRevert,
  onSelect,
}: {
  images: Array<{ id: string; imgUrl: string; isOriginal: boolean }>;
  selectedImageId?: string;
  onRevert?: (imageId: string) => void;
  onSelect?: (imageId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto bg-zinc-950/95 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-lg"
      style={{
        maxWidth: "calc(100vw - 500px)",
      }}
    >
      <div className="px-3 py-2">
        <ImageCarousel
          images={images}
          onRevert={onRevert}
          onSelect={onSelect}
          selectedImageId={selectedImageId || "original"}
          cardsPerView={5}
        />
      </div>
    </motion.div>
  );
}

export function IntersectionSidebar() {
  const {
    selectedHotspot,
    selectedCollision,
    placeInfo,
    selectHotspot,
    selectCollision,
  } = useMapStore();
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const isOpen = selectedHotspot !== null || selectedCollision !== null;
  const displayKey = selectedCollision?.id || selectedHotspot?.id || "none";

  const handleClose = () => {
    selectHotspot(null);
    selectCollision(null);
    setGeneratedImages([]);
    setCurrentImageId(null);
  };

  const handleImageReplaced = (imageUrl: string | null) => {
    if (!imageUrl) return;
    
    // Check if this image URL already exists to prevent duplicates
    setGeneratedImages((prev) => {
      const exists = prev.some((img) => img.url === imageUrl);
      if (exists) {
        // If it exists, just select the existing one
        const existing = prev.find((img) => img.url === imageUrl);
        if (existing) {
          setCurrentImageId(existing.id);
        }
        return prev;
      }
      
      // Add new generated image to the array
      const newImage: GeneratedImage = {
        id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        timestamp: Date.now(),
      };
      
      return [...prev, newImage];
    });
  };

  // Auto-select the newest image whenever a new image is added
  useEffect(() => {
    if (generatedImages.length > 0) {
      // Find the image with the highest timestamp (newest)
      const newestImage = generatedImages.reduce((latest, current) => {
        return current.timestamp > latest.timestamp ? current : latest;
      });
      
      // Always select the newest image when array changes
      setCurrentImageId(newestImage.id);
    }
  }, [generatedImages.length]); // Only trigger when array length changes (new image added)

  const handleRevert = (imageId: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
    // If we're reverting the current image, switch to original or next available
    if (currentImageId === imageId) {
      if (generatedImages.length > 1) {
        // Switch to the most recent remaining image
        const remaining = generatedImages.filter((img) => img.id !== imageId);
        if (remaining.length > 0) {
          const latest = remaining[remaining.length - 1];
          setCurrentImageId(latest.id);
        } else {
          setCurrentImageId(null);
        }
      } else {
        setCurrentImageId(null);
      }
    }
  };

  const handleSelectImage = (imageId: string) => {
    if (imageId === "original") {
      setCurrentImageId(null);
    } else {
      setCurrentImageId(imageId);
    }
  };

  // Reset generated images when switching between hotspots/collisions
  useEffect(() => {
    setGeneratedImages([]);
    setCurrentImageId(null);
  }, [displayKey]);

  // Get current image URL to display
  const getCurrentImageUrl = () => {
    if (currentImageId && currentImageId !== "original") {
      const image = generatedImages.find((img) => img.id === currentImageId);
      return image?.url || null;
    }
    return null; // null means show original
  };

  // Build carousel images array (original + generated)
  const getCarouselImages = () => {
    const images: Array<{ id: string; imgUrl: string; isOriginal: boolean }> = [];
    
    if (originalImageUrl) {
      images.push({
        id: "original",
        imgUrl: originalImageUrl,
        isOriginal: true,
      });
    }
    
    generatedImages.forEach((img) => {
      images.push({
        id: img.id,
        imgUrl: img.url,
        isOriginal: false,
      });
    });
    
    return images;
  };

  // Convert CollisionPoint to ClusteredHotspot format for UI compatibility
  const displayHotspot: ClusteredHotspot | null =
    selectedHotspot ||
    (selectedCollision
      ? {
          id: selectedCollision.id,
          centroid: { lat: selectedCollision.lat, lng: selectedCollision.lng },
          collisions: [selectedCollision], // Include the single collision in the array
          severity_score:
            selectedCollision.fatalities > 0
              ? 90
              : selectedCollision.injuryCollisions
                ? 60
                : 30, // how it works: if the collision is fatal, the severity score is 90. if the collision is an injury collision, the severity score is 60. if the collision is a property damage collision, the severity score is 30.
          total_count: 1,
          fatal_count: selectedCollision.fatalities,
          cyclist_count: selectedCollision.bicycle ? 1 : 0,
          pedestrian_count: selectedCollision.pedestrian ? 1 : 0,
          address:
            placeInfo?.formattedAddress ||
            selectedCollision.neighbourhood ||
            "Location",
          intersection:
            placeInfo?.streetName ||
            selectedCollision.neighbourhood ||
            "Intersection",
        }
      : null);

  // Get the original image URL for the current hotspot
  const getOriginalImageUrl = () => {
    if (!displayHotspot) return null;
    const lat = displayHotspot.centroid.lat;
    const lng = displayHotspot.centroid.lng;
    return `/api/streetview?lat=${lat}&lng=${lng}&heading=0&size=640x640`;
  };

  const originalImageUrl = getOriginalImageUrl();

  return (
    <AnimatePresence mode="wait">
      {isOpen && displayHotspot && (
        <motion.aside
          key={displayKey}
          initial={{ x: "100%", opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: "100%",
            opacity: 0,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 200,
          }}
          className="fixed right-0 top-0 z-30 h-screen w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col"
        >
          <motion.div
            key={displayKey}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
            }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {displayHotspot.intersection}
                </h2>
                <p className="text-sm text-zinc-400">
                  {selectedCollision
                    ? "Single collision record"
                    : `${displayHotspot.total_count} collisions recorded`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 hover:bg-zinc-800"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <PhotoProvider
                photoWrapClassName="photo-view-with-sidebar"
                photoClosable={false}
                maskOpacity={0.8}
                bannerVisible={false}
                overlayRender={({ images, index, onClose: photoViewClose }) => {
                  const currentImage = images[index];
                  return (
                    <PhotoViewOverlay 
                      imageSrc={currentImage?.src} 
                      onImageReplaced={handleImageReplaced}
                      onClose={photoViewClose}
                      currentImageUrl={getCurrentImageUrl()}
                      carouselImages={getCarouselImages()}
                      selectedImageId={currentImageId === null ? "original" : currentImageId}
                      onRevertImage={handleRevert}
                      onSelectImage={handleSelectImage}
                    />
                  );
                }}
              >
                <OverviewTab
                  hotspot={displayHotspot}
                  collision={selectedCollision}
                  placeInfo={placeInfo}
                  onImageReplaced={handleImageReplaced}
                  currentImageUrl={getCurrentImageUrl()}
                  carouselImages={getCarouselImages()}
                  selectedImageId={currentImageId === null ? "original" : currentImageId}
                  onRevertImage={handleRevert}
                  onSelectImage={handleSelectImage}
                />
              </PhotoProvider>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
