"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScanText, Loader2, Upload, AlertTriangle } from "lucide-react";

export interface OcrResult {
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  platform: string | null;
  booking_id: string | null;
  num_guests: number | null;
  property_name: string | null;
  notes: string | null;
}

interface OcrImportProps {
  onImport: (data: OcrResult, screenshotUrl: string) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resizeForOcr(file: File): Promise<Blob> {
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
        reject(new Error("Canvas not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export default function OcrImport({ onImport }: OcrImportProps) {
  const t = useTranslations("ocr");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("invalidType"));
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleProcess() {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      // Resize for OCR
      const resized = await resizeForOcr(selectedFile);
      const resizedFile = new File([resized], "screenshot.jpg", {
        type: "image/jpeg",
      });

      // Get base64 for OCR API
      const base64 = await fileToBase64(resizedFile);

      // Send to OCR endpoint
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!ocrRes.ok) {
        const data = await ocrRes.json().catch(() => ({}));
        throw new Error(data.error || t("processFailed"));
      }

      const ocrData = await ocrRes.json();

      // Upload screenshot to Google Drive as evidence
      const uploadForm = new FormData();
      uploadForm.append("file", resized, "ocr-screenshot.jpg");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      let screenshotUrl = "";
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.url;
      }

      // Send result to parent
      onImport(ocrData.data as OcrResult, screenshotUrl);
      setDialogOpen(false);
      resetState();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("processFailed")
      );
    } finally {
      setProcessing(false);
    }
  }

  function resetState() {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    setProcessing(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-1.5"
      >
        <ScanText className="size-4" />
        {t("importButton")}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetState();
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
              >
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {t("selectScreenshot")}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t("supportedFormats")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={preview}
                  alt="Screenshot preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => {
                    resetState();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {t("changeImage")}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
              className="hidden"
            />

            {error && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetState();
              }}
              disabled={processing}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!selectedFile || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("extract")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
