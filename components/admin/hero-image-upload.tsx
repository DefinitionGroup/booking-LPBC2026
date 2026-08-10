"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { upload as uploadBlob } from "@vercel/blob/client";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BACKGROUND_IMAGE_MAX_BYTES,
  getImageUploadPath,
  validateImageFile,
} from "@/lib/uploads/image-upload";

interface HeroImageUploadProps {
  currentUrl: string | null;
  name: string;
}

export function HeroImageUpload({ currentUrl, name }: HeroImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError(null);

    const validationError = validateImageFile(
      file,
      BACKGROUND_IMAGE_MAX_BYTES
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      const blob = await uploadBlob(
        getImageUploadPath("backgrounds", file.type),
        file,
        {
          access: "public",
          contentType: file.type,
          handleUploadUrl: "/api/upload/background",
        }
      );
      setPreview(blob.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      upload(files[0]);
    },
    [upload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearImage = () => setPreview(null);

  return (
    <div className="space-y-3">
      {/* Hidden form field so the value is submitted with the form */}
      <input type="hidden" name={name} value={preview ?? ""} />

      <div
        className={cn(
          "relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/40",
          preview ? "border-solid" : ""
        )}
        onClick={() => !preview && !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Hero background preview"
              fill
              className="rounded-xl object-cover"
            />
            <div className="absolute inset-0 rounded-xl bg-black/30" />
            <div className="relative z-10 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="bg-destructive/80 backdrop-blur-sm"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
            {uploading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/45">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
            {uploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <ImageIcon className="h-8 w-8 opacity-40" />
            )}
            <p className="text-xs">
              {uploading
                ? "Uploading…"
                : "Drag & drop a background image, or click to browse"}
            </p>
            <p className="text-[10px] opacity-60">JPEG, PNG, WebP, AVIF · max 10 MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
