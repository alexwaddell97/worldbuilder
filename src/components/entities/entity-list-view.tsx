"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { EntityPreviewDrawer } from "@/components/entities/entity-preview-drawer";
import { blobDisplayUrl } from "@/lib/utils";
import type { Entity, EntityType } from "@/lib/db/schema";

interface EntityListViewProps {
  entities: Entity[];
  entityType: EntityType;
  worldSlug: string;
}

export function EntityListView({ entities, entityType, worldSlug }: EntityListViewProps) {
  const [selected, setSelected] = useState<Entity | null>(null);

  // Preload the blob image as soon as the user hovers a row so it's
  // (partially) cached by the time the drawer opens on click.
  function preloadImage(imageUrl: string | null) {
    if (!imageUrl) return;
    const img = new window.Image();
    img.src = blobDisplayUrl(imageUrl);
  }

  if (entities.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        {entities.map((entity, i) => (
          <button
            key={entity.id}
            type="button"
            onMouseEnter={() => preloadImage(entity.imageUrl)}
            onClick={() => setSelected(entity)}
            className={[
              "w-full flex items-center gap-4 px-4 py-3 bg-card hover:bg-accent/40 active:bg-accent/60 transition-colors text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer",
              i !== 0 && "border-t border-border",
            ].filter(Boolean).join(" ")}
          >
            {/* Thumbnail */}
            <div className="h-11 w-11 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
              {entity.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blobDisplayUrl(entity.imageUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <DynamicIcon
                  name={entityType.icon ?? "tag"}
                  size={15}
                  className="text-muted-foreground/60"
                />
              )}
            </div>

            {/* Name + tags */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{entity.name}</p>
              {entity.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {entity.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      {tag}
                    </Badge>
                  ))}
                  {entity.tags.length > 4 && (
                    <span className="text-[10px] text-muted-foreground leading-4">
                      +{entity.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronRight
              size={15}
              className="text-muted-foreground/40 shrink-0 -translate-x-1 group-hover:translate-x-0 group-hover:text-muted-foreground transition-all duration-150"
            />
          </button>
        ))}
      </div>

      <EntityPreviewDrawer
        entity={selected}
        entityType={entityType}
        worldSlug={worldSlug}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
