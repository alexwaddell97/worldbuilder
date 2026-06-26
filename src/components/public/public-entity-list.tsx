"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FadeImage } from "@/components/ui/fade-image";
import { Badge } from "@/components/ui/badge";
import { blobDisplayUrl } from "@/lib/utils";

interface PublicEntity {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imagePosition: string | null;
  tags: string[];
}

interface PublicEntityListProps {
  entities: PublicEntity[];
  typeSlug: string;
  typeName: string;
  basePath: string;
}

export function PublicEntityList({ entities, typeSlug, typeName, basePath }: PublicEntityListProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? entities.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : entities;

  return (
    <>
      {entities.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`Search ${typeName.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {query ? `No ${typeName.toLowerCase()} match "${query}"` : `No ${typeName.toLowerCase()} yet.`}
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entity) => (
            <Link
              key={entity.id}
              href={`${basePath}/entities/${typeSlug}/${entity.slug}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              {entity.imageUrl ? (
                <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
                  <FadeImage
                    src={blobDisplayUrl(entity.imageUrl)}
                    alt={entity.name}
                    className="object-cover"
                    style={entity.imagePosition ? { objectPosition: entity.imagePosition } : undefined}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted shrink-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-muted-foreground/40">
                    {entity.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entity.name}</p>
                {entity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entity.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {entity.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{entity.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
