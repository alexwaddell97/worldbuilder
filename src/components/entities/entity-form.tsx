"use client";

import { useActionState, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CustomFieldsForm } from "@/components/entities/custom-fields-form";
import { ImageUpload } from "@/components/ui/image-upload";
import type { EntityActionState } from "@/lib/validations/entities";
import type { CustomFieldDef, CustomFieldValues } from "@/lib/db/schema";

interface EntityFormProps {
  action: (
    prevState: EntityActionState,
    formData: FormData
  ) => Promise<EntityActionState>;
  initialValues?: { name: string; tags: string[]; customFields?: CustomFieldValues; imageUrl?: string | null };
  customFieldDefs?: CustomFieldDef[];
  submitLabel: string;
  pendingLabel: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EntityForm({
  action,
  initialValues,
  customFieldDefs = [],
  submitLabel,
  pendingLabel,
  onSuccess,
  onCancel,
}: EntityFormProps) {
  const [state, formAction, pending] = useActionState(action, { errors: {} });
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);

  useEffect(() => {
    if (state.message === "saved") onSuccess?.();
  }, [state.message, onSuccess]);

  function addTagFromInput() {
    const newTags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const merged = [...new Set([...tags, ...newTags])];
    setTags(merged);
    setTagInput("");
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTagFromInput();
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Tags submitted as comma-separated hidden input */}
      <input type="hidden" name="tags" value={tags.join(",")} />

      <div className="space-y-1.5">
        <Label>Image</Label>
        <ImageUpload name="imageUrl" currentUrl={initialValues?.imageUrl} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="entity-name">Name</Label>
        <Input
          id="entity-name"
          name="name"
          autoFocus
          maxLength={100}
          defaultValue={initialValues?.name ?? ""}
          aria-describedby={state.errors?.name ? "entity-name-error" : undefined}
        />
        {state.errors?.name && (
          <p id="entity-name-error" className="text-sm text-destructive">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="entity-tags">Tags</Label>
        <Input
          id="entity-tags"
          placeholder="Add tags…"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTagFromInput}
        />
        <p className="text-xs text-muted-foreground">Separate with commas</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {customFieldDefs.length > 0 && (
        <>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">
            Custom fields
          </p>
          <CustomFieldsForm
            fields={customFieldDefs}
            defaultValues={initialValues?.customFields}
          />
        </>
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
