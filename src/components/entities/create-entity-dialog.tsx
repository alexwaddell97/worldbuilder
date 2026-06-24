"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EntityForm } from "@/components/entities/entity-form";
import { createEntityAction } from "@/lib/actions/entities";
import type { EntityType } from "@/lib/db/schema";

interface CreateEntityDialogProps {
  worldId: string;
  entityType: EntityType;
}

export function CreateEntityDialog({
  worldId,
  entityType,
}: CreateEntityDialogProps) {
  const [open, setOpen] = useState(false);
  const boundAction = createEntityAction.bind(null, worldId, entityType.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          New {entityType.name}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New {entityType.name}</DialogTitle>
        </DialogHeader>
        <EntityForm
          action={boundAction}
          customFieldDefs={entityType.customFieldsSchema.fields}
          submitLabel={`Create ${entityType.name}`}
          pendingLabel="Creating…"
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
