"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import { EditEntityTypeDialog } from "@/components/entity-types/edit-entity-type-dialog";
import { DeleteEntityTypeDialog } from "@/components/entity-types/delete-entity-type-dialog";
import { toggleEntityTypePublicVisibilityAction } from "@/lib/actions/entity-types";
import type { EntityType } from "@/lib/db/schema";

interface EntityTypeRowActionsProps {
  entityType: EntityType;
  worldId: string;
}

export function EntityTypeRowActions({
  entityType,
  worldId,
}: EntityTypeRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(entityType.isHiddenFromPublic);
  const [pending, startTransition] = useTransition();

  function handleToggleVisibility() {
    startTransition(async () => {
      const result = await toggleEntityTypePublicVisibilityAction(entityType.id, worldId);
      setIsHidden(result.isHiddenFromPublic);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleVisibility} disabled={pending}>
            {isHidden ? (
              <><Eye size={14} className="mr-2" />Show in public</>
            ) : (
              <><EyeOff size={14} className="mr-2" />Hide from public</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEntityTypeDialog
        entityType={entityType}
        worldId={worldId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEntityTypeDialog
        entityType={entityType}
        worldId={worldId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
