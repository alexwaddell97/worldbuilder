"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EditEntityTypeDialog } from "@/components/entity-types/edit-entity-type-dialog";
import { DeleteEntityTypeDialog } from "@/components/entity-types/delete-entity-type-dialog";
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
