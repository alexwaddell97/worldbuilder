import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ArtAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://www.artstation.com/tohad"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors",
        className
      )}
    >
      Art © Sylvain Sarrailh
      <ExternalLink size={10} aria-hidden="true" />
    </a>
  );
}
