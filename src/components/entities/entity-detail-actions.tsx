"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditEntityDialog } from "@/components/entities/edit-entity-dialog";
import { DeleteEntityDialog } from "@/components/entities/delete-entity-dialog";
import type { Entity, EntityType } from "@/lib/db/schema";

interface EntityDetailActionsProps {
  entity: Entity;
  entityType: EntityType;
  worldId: string;
}

export function EntityDetailActions({
  entity,
  entityType,
  worldId,
}: EntityDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil size={14} />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        aria-label={`Delete ${entity.name}`}
      >
        <Trash2 size={16} />
      </Button>
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
    </div>
  );
}
