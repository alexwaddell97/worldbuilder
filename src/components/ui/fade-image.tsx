"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FadeImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FadeImage({ src, alt, className, style }: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={style}
      />
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted pointer-events-none" />
      )}
    </div>
  );
}
