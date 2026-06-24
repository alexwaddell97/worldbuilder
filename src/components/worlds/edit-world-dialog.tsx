"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorldForm } from "@/components/worlds/world-form";
import { updateWorldAction } from "@/lib/actions/worlds";
import type { World } from "@/lib/db/schema";

interface EditWorldDialogProps {
  world: World;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorldDialog({ world, open, onOpenChange }: EditWorldDialogProps) {
  const boundAction = useMemo(
    () => updateWorldAction.bind(null, world.id),
    [world.id]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit world</DialogTitle>
          <DialogDescription>
            Update your world&apos;s name or description. The slug cannot be changed after creation.
          </DialogDescription>
        </DialogHeader>
        <WorldForm
          action={boundAction}
          initialValues={{
            name: world.name,
            description: world.description ?? "",
          }}
          fixedSlug={world.slug}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
