"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { cn, blobDisplayUrl } from "@/lib/utils";

interface ImageUploadProps {
  name: string;
  currentUrl?: string | null;
  currentPosition?: string | null;
  aspectRatio?: "video" | "square";
  onPositionChange?: () => void;
  className?: string;
}

function parsePosition(pos: string | null | undefined): { x: number; y: number } {
  if (!pos) return { x: 50, y: 50 };
  const parts = pos.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (parts) return { x: parseFloat(parts[1]), y: parseFloat(parts[2]) };
  return { x: 50, y: 50 };
}

export function ImageUpload({ name, currentUrl, currentPosition, aspectRatio = "video", onPositionChange, className }: ImageUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [position, setPosition] = useState(() => parsePosition(currentPosition));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

  const positionCss = `${Math.round(position.x)}% ${Math.round(position.y)}%`;

  function handleMouseDown(e: React.MouseEvent) {
    if (!url) return;
    e.preventDefault();
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: position.x, posY: position.y };
    setIsDragging(true);
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    const newX = Math.max(0, Math.min(100, dragStart.current.posX - (dx / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, dragStart.current.posY - (dy / rect.height) * 100));
    setPosition({ x: newX, y: newY });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragStart.current) {
      onPositionChange?.();
    }
    dragStart.current = null;
    setIsDragging(false);
  }, [onPositionChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
        setPosition({ x: 50, y: 50 });
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemove() {
    setUrl(null);
    setError(null);
    setPosition({ x: 50, y: 50 });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name={name} value={url ?? ""} />
      {url && <input type="hidden" name={`${name}Position`} value={positionCss} />}

      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-lg border border-dashed border-border bg-muted/30 overflow-hidden select-none",
          !url && "flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:bg-muted/50",
          url && (aspectRatio === "square" ? "aspect-square" : "aspect-video"),
          url && !isDragging && "cursor-grab",
          url && isDragging && "cursor-grabbing",
        )}
        onClick={() => !url && !uploading && fileInputRef.current?.click()}
        onMouseDown={url ? handleMouseDown : undefined}
        onMouseEnter={() => url && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobDisplayUrl(url)}
              alt="Uploaded image"
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{ objectPosition: positionCss }}
              draggable={false}
            />
            {(isHovering || isDragging) && !uploading && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-2 pointer-events-none">
                <span className="text-[11px] font-medium text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {isDragging ? "Repositioning" : "Drag to reposition"}
                </span>
              </div>
            )}
          </>
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
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 cursor-pointer"
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
