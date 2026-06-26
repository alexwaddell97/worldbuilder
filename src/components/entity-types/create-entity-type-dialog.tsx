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
import { EntityTypeForm } from "@/components/entity-types/entity-type-form";
import { createEntityTypeAction } from "@/lib/actions/entity-types";

interface CreateEntityTypeDialogProps {
  worldId: string;
  isPublicWorld?: boolean;
}

export function CreateEntityTypeDialog({ worldId, isPublicWorld }: CreateEntityTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const boundAction = createEntityTypeAction.bind(null, worldId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          New entity type
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New entity type</DialogTitle>
        </DialogHeader>
        <EntityTypeForm
          action={boundAction}
          submitLabel="Create entity type"
          pendingLabel="Creating…"
          isPublicWorld={isPublicWorld}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
