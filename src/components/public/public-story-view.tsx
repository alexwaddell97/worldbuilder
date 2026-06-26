"use client";

import { useCallback, useState } from "react";
import { ReadOnlyContent } from "@/components/entities/read-only-content";
import { EntityPreviewDrawer } from "@/components/entities/entity-preview-drawer";
import { getPublicEntityWithTypeByIdAction } from "@/lib/actions/public";
import type { Entity, EntityType } from "@/lib/db/schema";

interface PublicStoryViewProps {
  content: unknown;
  worldId: string;
}

export function PublicStoryView({ content, worldId }: PublicStoryViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntity, setDrawerEntity] = useState<Entity | null>(null);
  const [drawerEntityType, setDrawerEntityType] = useState<EntityType | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchEntity = useCallback(
    (entityId: string) => getPublicEntityWithTypeByIdAction(worldId, entityId),
    [worldId]
  );

  const handleWikilinkClick = useCallback(
    async (entityId: string) => {
      setDrawerLoading(true);
      setDrawerOpen(true);
      setDrawerEntity(null);
      setDrawerEntityType(null);
      const result = await fetchEntity(entityId);
      if (result) {
        setDrawerEntity(result.entity);
        setDrawerEntityType(result.entityType);
        setDrawerLoading(false);
      } else {
        setDrawerOpen(false);
        setDrawerLoading(false);
      }
    },
    [fetchEntity]
  );

  return (
    <>
      <ReadOnlyContent content={content} onWikilinkClick={handleWikilinkClick} />

      <EntityPreviewDrawer
        entity={drawerEntity}
        entityType={drawerEntityType}
        worldSlug=""
        open={drawerOpen}
        loading={drawerLoading}
        readOnly
        fetchEntity={fetchEntity}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerEntity(null);
          setDrawerEntityType(null);
        }}
      />
    </>
  );
}
