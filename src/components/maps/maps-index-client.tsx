"use client";

import { useState } from "react";
import { Search, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MapTree } from "@/components/maps/map-tree";
import { CreateMapDialog } from "@/components/maps/create-map-dialog";
import { buildMapTree } from "@/lib/db/queries/maps";
import { blobDisplayUrl } from "@/lib/utils";
import Link from "next/link";
import type { Map } from "@/lib/db/schema";

interface MapsIndexClientProps {
  maps: Map[];
  worldId: string;
  worldSlug: string;
  basePath: string;
}

export function MapsIndexClient({ maps, worldId, worldSlug, basePath }: MapsIndexClientProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? maps.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : null;

  const tree = filtered ? null : buildMapTree(maps);

  return (
    <>
      {maps.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search maps…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {maps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <MapIcon size={40} strokeWidth={1} />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No maps yet</p>
            <p className="text-sm mt-1">Create a map and pin entities to bring your world to life.</p>
          </div>
          <CreateMapDialog worldId={worldId} worldSlug={worldSlug} allMaps={maps} />
        </div>
      ) : filtered ? (
        filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No maps match &ldquo;{query}&rdquo;</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {filtered.map((map) => (
              <Link
                key={map.id}
                href={`${basePath}/${map.slug}`}
                className="group rounded-xl border border-border overflow-hidden bg-card hover:shadow-sm transition-shadow"
              >
                <div className="relative h-36 bg-muted flex items-center justify-center">
                  {map.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blobDisplayUrl(map.imageUrl)} alt={map.name} className="h-full w-full object-cover" />
                  ) : (
                    <MapIcon size={32} strokeWidth={1} className="text-muted-foreground/40" />
                  )}
                </div>
                <div className="px-4 pt-3 pb-3">
                  <p className="text-sm font-medium group-hover:underline underline-offset-4 truncate">{map.name}</p>
                  {map.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{map.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <MapTree nodes={tree!} basePath={basePath} />
      )}
    </>
  );
}
