"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoGalleryProps {
  photos: string[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const t = useTranslations("upload");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  function openLightbox(index: number) {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }

  function nextPhoto() {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }

  function prevPhoto() {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  return (
    <>
      <div className="flex items-center gap-2 mt-3 mb-1">
        <Camera className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          {t("photosLabel", { count: photos.length })}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {photos.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => openLightbox(index)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
          >
            <img
              src={url}
              alt={`${t("photo")} ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[300px]">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 text-white/70 hover:text-white p-1"
            >
              <X className="size-5" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 z-10 text-white/70 hover:text-white p-2"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 z-10 text-white/70 hover:text-white p-2"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            <img
              src={photos[currentIndex]}
              alt={`${t("photo")} ${currentIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain p-4"
            />

            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-xs">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
