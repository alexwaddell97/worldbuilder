"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WorldActionState } from "@/lib/validations/worlds";

function deriveSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface WorldFormProps {
  action: (prevState: WorldActionState, formData: FormData) => Promise<WorldActionState>;
  initialValues?: { name: string; description: string };
  /** When provided (edit mode), the slug is shown as-is and never re-derived from the name. */
  fixedSlug?: string;
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
}

export function WorldForm({
  action,
  initialValues,
  fixedSlug,
  submitLabel,
  pendingLabel,
  onSuccess,
}: WorldFormProps) {
  const [state, formAction, pending] = useActionState(action, { errors: {} });
  const [name, setName] = useState(initialValues?.name ?? "");
  const slugPreview = fixedSlug ?? deriveSlugPreview(name);

  useEffect(() => {
    if (state.message === "saved") {
      onSuccess?.();
    }
  }, [state.message, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">World name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. The Shattered Realm"
          autoFocus
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby={state.errors?.name ? "name-error" : undefined}
        />
        {state.errors?.name && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What is this world about? (optional)"
          rows={3}
          maxLength={500}
          defaultValue={initialValues?.description ?? ""}
          aria-describedby={state.errors?.description ? "description-error" : undefined}
        />
        {state.errors?.description && (
          <p id="description-error" className="text-sm text-destructive mt-1">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">URL slug</p>
        <div className="bg-muted rounded-md px-3 py-2 text-sm font-mono text-muted-foreground">
          /worlds/{slugPreview || "…"}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Discard
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
