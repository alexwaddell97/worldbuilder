"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityTypeForm } from "@/components/entity-types/entity-type-form";
import { updateEntityTypeAction } from "@/lib/actions/entity-types";
import type { EntityType } from "@/lib/db/schema";

interface EditEntityTypeDialogProps {
  entityType: EntityType;
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntityTypeDialog({
  entityType,
  worldId,
  open,
  onOpenChange,
}: EditEntityTypeDialogProps) {
  const boundAction = updateEntityTypeAction.bind(null, entityType.id, worldId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {entityType.name}</DialogTitle>
        </DialogHeader>
        <EntityTypeForm
          action={boundAction}
          initialValues={{ name: entityType.name, icon: entityType.icon ?? "" }}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
