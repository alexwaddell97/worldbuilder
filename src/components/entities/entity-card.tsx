"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditEntityDialog } from "@/components/entities/edit-entity-dialog";
import { DeleteEntityDialog } from "@/components/entities/delete-entity-dialog";
import { blobDisplayUrl } from "@/lib/utils";
import { FadeImage } from "@/components/ui/fade-image";
import type { Entity, EntityType } from "@/lib/db/schema";

interface EntityCardProps {
  entity: Entity;
  entityType: EntityType;
  worldId: string;
  worldSlug: string;
}

export function EntityCard({
  entity,
  entityType,
  worldId,
  worldSlug,
}: EntityCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const entityHref = `/worlds/${worldSlug}/entities/${entityType.slug}/${entity.slug}`;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-sm transition-shadow">
        {entity.imageUrl && (
          <div className="w-full h-24">
            <FadeImage
              src={blobDisplayUrl(entity.imageUrl)}
              alt={`${entity.name} image`}
              className="object-cover"
              style={entity.imagePosition ? { objectPosition: entity.imagePosition } : undefined}
            />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={entityHref}
                className="text-base font-semibold hover:underline underline-offset-4"
              >
                {entity.name}
              </Link>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 ml-2"
                  aria-label={`Entity options for ${entity.name}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entity.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditEntityDialog
        entity={entity}
        entityType={entityType}
        worldId={worldId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEntityDialog
        entity={entity}
        worldId={worldId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
