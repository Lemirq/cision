"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useMapStore } from "@/stores/map-store";
import { X, Undo2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { PhotoProvider } from "react-photo-view";
import { ImageChatSidebar } from "./image-chat-sidebar";
import type { ClusteredHotspot } from "@/types/collision";

function PhotoViewOverlay({ 
  imageSrc, 
  onImageReplaced,
  onClose,
  replacedImageUrl,
  onUndo
}: { 
  imageSrc?: string;
  onImageReplaced?: (imageUrl: string | null) => void;
  onClose?: () => void;
  replacedImageUrl?: string | null;
  onUndo?: () => void;
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

  // Use replaced image if available, otherwise use original imageSrc
  const currentImageSrc = replacedImageUrl || imageSrc;

  return (
    <>
      <ImageChatSidebar 
        imageSrc={currentImageSrc} 
        onImageReplaced={onImageReplaced} 
        onClose={onClose} 
      />
      {replacedImageUrl && onUndo && (
        <UndoButton onUndo={onUndo} />
      )}
    </>
  );
}

function UndoButton({ onUndo }: { onUndo: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-4 left-4 z-[70] pointer-events-auto"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUndo();
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-lg transition-colors"
        title="Undo - Restore original image"
      >
        <Undo2 className="h-4 w-4" />
        <span className="text-sm font-medium">Undo</span>
      </button>
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
  const [replacedImageUrl, setReplacedImageUrl] = useState<string | null>(null);
  const isOpen = selectedHotspot !== null || selectedCollision !== null;
  const displayKey = selectedCollision?.id || selectedHotspot?.id || "none";

  const handleClose = () => {
    selectHotspot(null);
    selectCollision(null);
    setReplacedImageUrl(null); // Reset replaced image when closing
  };

  const handleImageReplaced = (imageUrl: string | null) => {
    setReplacedImageUrl(imageUrl);
  };

  const handleUndo = () => {
    setReplacedImageUrl(null);
  };

  // Reset replaced image when switching between hotspots/collisions
  useEffect(() => {
    setReplacedImageUrl(null);
  }, [displayKey]);

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
          className="fixed right-0 top-0 z-50 h-screen w-[400px] border-l border-zinc-800 bg-zinc-950 flex flex-col"
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
                      replacedImageUrl={replacedImageUrl}
                      onUndo={handleUndo}
                    />
                  );
                }}
              >
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="audit">Safety Audit</TabsTrigger>
                    <TabsTrigger value="reimagine">Re-imagine</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <OverviewTab
                      hotspot={displayHotspot}
                      collision={selectedCollision}
                      placeInfo={placeInfo}
                      onImageReplaced={handleImageReplaced}
                      replacedImageUrl={replacedImageUrl}
                    />
                  </TabsContent>

                  <TabsContent value="audit" className="mt-4">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-sm text-zinc-400">
                        Generate a safety audit to see AI analysis
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="reimagine" className="mt-4">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-sm text-zinc-400">
                        Re-imagine this intersection with AI
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </PhotoProvider>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
