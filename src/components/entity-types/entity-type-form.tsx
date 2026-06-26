"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/entity-types/icon-picker";
import type { EntityTypeActionState } from "@/lib/validations/entity-types";

interface EntityTypeFormProps {
  action: (
    prevState: EntityTypeActionState,
    formData: FormData
  ) => Promise<EntityTypeActionState>;
  initialValues?: { name: string; namePlural?: string; icon?: string; isHiddenFromPublic?: boolean };
  isPublicWorld?: boolean;
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityTypeForm({
  action,
  initialValues,
  isPublicWorld,
  submitLabel,
  pendingLabel,
  onSuccess,
  onCancel,
}: EntityTypeFormProps) {
  const [state, formAction, pending] = useActionState(action, { errors: {} });
  const [icon, setIcon] = useState(initialValues?.icon ?? "");
  const [hiddenFromPublic, setHiddenFromPublic] = useState(initialValues?.isHiddenFromPublic ?? false);

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

      <div className="space-y-1.5">
        <Label htmlFor="et-name-plural">Plural name</Label>
        <Input
          id="et-name-plural"
          name="namePlural"
          maxLength={50}
          defaultValue={initialValues?.namePlural ?? ""}
          placeholder={`e.g. People, Locations, Factions`}
          aria-describedby={state.errors?.namePlural ? "et-name-plural-error" : undefined}
        />
        {state.errors?.namePlural && (
          <p id="et-name-plural-error" className="text-sm text-destructive">
            {state.errors.namePlural[0]}
          </p>
        )}
      </div>

      {isPublicWorld && (
        <div className="flex items-start gap-3">
          <Checkbox
            id="et-hidden-from-public"
            checked={hiddenFromPublic}
            onCheckedChange={(v: boolean | "indeterminate") => setHiddenFromPublic(v === true)}
            className="mt-0.5"
          />
          <input type="hidden" name="isHiddenFromPublic" value={String(hiddenFromPublic)} />
          <div>
            <Label htmlFor="et-hidden-from-public" className="cursor-pointer">
              Hide from public
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              This entity type won&apos;t appear on your world&apos;s public page.
            </p>
          </div>
        </div>
      )}

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
