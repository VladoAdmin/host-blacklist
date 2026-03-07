"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Camera, X, Loader2, Upload } from "lucide-react";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxSize = 1200;
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

async function uploadPhoto(file: File): Promise<string> {
  const resized = await resizeImage(file);
  const formData = new FormData();
  formData.append("file", resized, "photo.jpg");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.url;
}

export default function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 3,
}: PhotoUploadProps) {
  const t = useTranslations("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxPhotos - photos.length;

      if (remaining <= 0) {
        setError(t("maxReached", { max: maxPhotos }));
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      const validFiles = toUpload.filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
      );

      if (validFiles.length === 0) {
        setError(t("invalidType"));
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const urls: string[] = [];
        for (const file of validFiles) {
          const url = await uploadPhoto(file);
          urls.push(url);
        }
        onPhotosChange([...photos, ...urls]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("uploadFailed")
        );
      } finally {
        setUploading(false);
      }
    },
    [photos, onPhotosChange, maxPhotos, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`${t("photo")} ${index + 1}`}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {photos.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("uploading")}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Camera className="size-4" />
                <Upload className="size-4" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dropOrClick")}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {t("maxPhotos", { current: photos.length, max: maxPhotos })}
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
