"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Hidden input name submitted with the form. */
  name: string;
  /** Pre-existing image URL (edit mode). */
  currentUrl?: string | null;
  className?: string;
}

export function ImageUpload({ name, currentUrl, className }: ImageUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
      } else {
        setUrl(data.url);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset input so selecting the same file again triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemove() {
    setUrl(null);
    setError(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Hidden input carries the URL into the form submission */}
      <input type="hidden" name={name} value={url ?? ""} />

      <div
        className={cn(
          "relative w-full rounded-lg border border-dashed border-border bg-muted/30 overflow-hidden transition-colors",
          !url && "flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:bg-muted/50",
          url && "aspect-video"
        )}
        onClick={() => !url && !uploading && fileInputRef.current?.click()}
        role={!url ? "button" : undefined}
        tabIndex={!url ? 0 : undefined}
        onKeyDown={(e) => { if (!url && (e.key === "Enter" || e.key === " ")) fileInputRef.current?.click(); }}
      >
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {url ? (
          <Image
            src={url}
            alt="Uploaded image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">Click to upload an image</p>
            <p className="text-[10px] text-muted-foreground/70">JPEG, PNG, WebP or GIF · Max 4 MB</p>
          </>
        )}
      </div>

      {url && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image"
      />
    </div>
  );
}
