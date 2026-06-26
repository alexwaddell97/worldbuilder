"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { ReadOnlyContent } from "@/components/entities/read-only-content";
import { blobDisplayUrl } from "@/lib/utils";
import { FadeImage } from "@/components/ui/fade-image";
import { getEntityWithTypeByIdAction } from "@/lib/actions/entities";
import type { Entity, EntityType } from "@/lib/db/schema";
import type { CustomFieldValues } from "@/lib/db/schema";

interface EntityPreviewDrawerProps {
  entity: Entity | null;
  entityType: EntityType | null;
  worldSlug: string;
  open: boolean;
  loading?: boolean;
  hideOverlay?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  fetchEntity?: (entityId: string) => Promise<{ entity: Entity; entityType: EntityType } | null>;
}

export function EntityPreviewDrawer({
  entity,
  entityType,
  worldSlug,
  open,
  loading = false,
  hideOverlay = false,
  readOnly = false,
  onClose,
  fetchEntity,
}: EntityPreviewDrawerProps) {
  const [linkedEntity, setLinkedEntity] = useState<Entity | null>(null);
  const [linkedEntityType, setLinkedEntityType] = useState<EntityType | null>(null);

  const activeEntity = linkedEntity ?? entity;
  const activeEntityType = linkedEntityType ?? entityType;

  const handleWikilinkClick = useCallback(
    async (entityId: string) => {
      if (!entity) return;
      const resolver = fetchEntity ?? ((id) => getEntityWithTypeByIdAction(entity.worldId, id));
      const result = await resolver(entityId);
      if (result) {
        setLinkedEntity(result.entity);
        setLinkedEntityType(result.entityType);
      }
    },
    [entity, fetchEntity]
  );

  function handleClose() {
    setLinkedEntity(null);
    setLinkedEntityType(null);
    onClose();
  }

  if (!open) return null;

  if (loading || !activeEntity || !activeEntityType) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden border-0" hideOverlay={hideOverlay}>
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5">
            <div className="h-8" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Separator />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const editHref = `/worlds/${worldSlug}/entities/${activeEntityType.slug}/${activeEntity.slug}`;
  const customFieldValues = activeEntity.customFields as CustomFieldValues;
  const fieldsWithValues = activeEntityType.customFieldsSchema.fields.filter(
    (f) =>
      customFieldValues[f.key] !== undefined &&
      customFieldValues[f.key] !== null &&
      customFieldValues[f.key] !== ""
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden border-0"
        hideOverlay={hideOverlay}
      >
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover image */}
          {activeEntity.imageUrl ? (
            <div className="relative w-full h-52 shrink-0 bg-muted">
              <FadeImage
                src={blobDisplayUrl(activeEntity.imageUrl)}
                alt={activeEntity.name}
                className="object-cover"
                style={activeEntity.imagePosition ? { objectPosition: activeEntity.imagePosition } : undefined}
              />
              {/* Top fade — keeps the sheet close button legible */}
              <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-background/70 to-transparent pointer-events-none" />
              {/* Bottom fade — softens the transition into the content */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="h-8" /> /* space for the sheet close button */
          )}

          <div className="px-6 py-5 space-y-5">
            {/* Header */}
            <SheetHeader className="p-0 space-y-1 text-left">
              <div className="flex items-start justify-between gap-3 pr-6">
                <SheetTitle className="text-lg leading-snug">{activeEntity.name}</SheetTitle>
                {!readOnly && (
                  <Button asChild size="sm" variant="outline" className="shrink-0 h-8 gap-1.5 text-xs">
                    <Link href={editHref}>
                      <Pencil size={12} />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DynamicIcon name={activeEntityType.icon ?? ""} size={12} />
                <span className="text-xs">{activeEntityType.name}</span>
              </div>
            </SheetHeader>

            {/* Tags */}
            {activeEntity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeEntity.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Custom fields */}
            {fieldsWithValues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  {fieldsWithValues.map((field) => {
                    const value = customFieldValues[field.key];
                    return (
                      <div key={field.key} className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field.label}</span>
                        <span className="text-sm">
                          {field.type === "boolean" ? (value ? "Yes" : "No") : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Content */}
            <Separator />
            <ReadOnlyContent key={activeEntity.id} content={activeEntity.content} onWikilinkClick={handleWikilinkClick} />

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
