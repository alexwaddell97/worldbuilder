"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityForm } from "@/components/entities/entity-form";
import { updateEntityAction } from "@/lib/actions/entities";
import type { CustomFieldValues } from "@/lib/db/schema";
import type { Entity, EntityType } from "@/lib/db/schema";

interface EditEntityDialogProps {
  entity: Entity;
  entityType: EntityType;
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntityDialog({
  entity,
  entityType,
  worldId,
  open,
  onOpenChange,
}: EditEntityDialogProps) {
  const boundAction = updateEntityAction.bind(null, entity.id, worldId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {entity.name}</DialogTitle>
        </DialogHeader>
        <EntityForm
          action={boundAction}
          initialValues={{
            name: entity.name,
            tags: entity.tags,
            customFields: entity.customFields as CustomFieldValues,
            imageUrl: entity.imageUrl,
          }}
          customFieldDefs={entityType.customFieldsSchema.fields}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
