"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/entity-types/icon-picker";
import type { EntityTypeActionState } from "@/lib/validations/entity-types";

interface EntityTypeFormProps {
  action: (
    prevState: EntityTypeActionState,
    formData: FormData
  ) => Promise<EntityTypeActionState>;
  initialValues?: { name: string; icon?: string };
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityTypeForm({
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  onSuccess,
  onCancel,
}: EntityTypeFormProps) {
  const [state, formAction, pending] = useActionState(action, { errors: {} });
  const [icon, setIcon] = useState(initialValues?.icon ?? "");

  useEffect(() => {
    if (state.message === "saved") onSuccess?.();
  }, [state.message, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Icon is controlled — submit as hidden input */}
      <input type="hidden" name="icon" value={icon} />

      <div className="space-y-1.5">
        <Label>Icon</Label>
        <div className="flex items-center gap-3">
          <IconPicker value={icon} onChange={setIcon} />
          <span className="text-xs text-muted-foreground">
            Choose an icon for this type
          </span>
        </div>
        {state.errors?.icon && (
          <p className="text-sm text-destructive">{state.errors.icon[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="et-name">Name</Label>
        <Input
          id="et-name"
          name="name"
          autoFocus
          maxLength={50}
          defaultValue={initialValues?.name ?? ""}
          aria-describedby={state.errors?.name ? "et-name-error" : undefined}
        />
        {state.errors?.name && (
          <p id="et-name-error" className="text-sm text-destructive">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {state.message && state.message !== "saved" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1" />
              {pendingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
