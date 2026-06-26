"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteEntityTypeAction } from "@/lib/actions/entity-types";
import type { EntityType } from "@/lib/db/schema";

interface DeleteEntityTypeDialogProps {
  entityType: EntityType;
  worldId: string;
  entityCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEntityTypeDialog({
  entityType,
  worldId,
  entityCount,
  open,
  onOpenChange,
}: DeleteEntityTypeDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState("");

  const confirmed = confirmValue === entityType.name;

  function handleDelete() {
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEntityTypeAction(entityType.id, worldId);
      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) setConfirmValue("");
    onOpenChange(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType.name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            This action cannot be undone. {entityType.name} will be permanently
            removed{entityCount != null && entityCount > 0 ? (
              <>, along with <span className="text-destructive font-medium">{entityCount} {entityCount === 1 ? entityType.name : (entityType.namePlural ?? `${entityType.name}s`)}</span></>
            ) : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label className="text-sm">
            Type <span className="font-semibold">{entityType.name}</span> to confirm
          </Label>
          <Input
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            placeholder={entityType.name}
            autoComplete="off"
          />
        </div>
        {error && <p className="text-sm text-destructive px-1">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending || !confirmed}
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
