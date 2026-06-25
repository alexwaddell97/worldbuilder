import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a private Vercel Blob URL to a URL served through our /api/blob route. */
export function blobDisplayUrl(blobUrl: string): string {
  return `/api/blob?pathname=${encodeURIComponent(blobUrl)}`;
}

/** Returns a naive plural of a word, handling common irregular endings. */
export function pluralize(word: string): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  // Already ends in s/x/z/ch/sh — leave as-is (covers "species", "class", "mesh", etc.)
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z") ||
      lower.endsWith("ch") || lower.endsWith("sh")) {
    return word;
  }
  if (lower.endsWith("y") && lower.length > 1 && !/[aeiou]/.test(lower[lower.length - 2])) {
    return `${word.slice(0, -1)}ies`;
  }
  return `${word}s`;
}
