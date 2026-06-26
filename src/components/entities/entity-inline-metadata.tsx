"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { updateEntityAction, toggleEntityPublicVisibilityAction } from "@/lib/actions/entities";
import { ImageUpload } from "@/components/ui/image-upload";
import { CustomFieldsForm } from "@/components/entities/custom-fields-form";
import { DeleteEntityDialog } from "@/components/entities/delete-entity-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { Trash2, X, EyeOff, Eye } from "lucide-react";
import type { Entity, EntityType, CustomFieldValues } from "@/lib/db/schema";

interface EntityInlineMetadataProps {
  entity: Entity;
  entityType: EntityType;
  worldId: string;
  worldSlug: string;
  isPublicWorld?: boolean;
}

export function EntityInlineMetadata({ entity, entityType, worldId, worldSlug, isPublicWorld }: EntityInlineMetadataProps) {
  const router = useRouter();
  const boundAction = updateEntityAction.bind(null, entity.id, worldId, worldSlug, entityType.slug);
  const [state, formAction, pending] = useActionState(boundAction, {});

  const [tags, setTags] = useState<string[]>(entity.tags);
  const [tagInput, setTagInput] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(entity.isHiddenFromPublic);
  const [visibilityPending, startVisibilityTransition] = useTransition();

  function handleToggleVisibility() {
    startVisibilityTransition(async () => {
      const result = await toggleEntityPublicVisibilityAction(entity.id, worldId);
      setIsHidden(result.isHiddenFromPublic);
    });
  }

  useEffect(() => {
    function handleContentDirty() { setIsDirty(true); }
    window.addEventListener("entity-content-dirty", handleContentDirty);
    return () => window.removeEventListener("entity-content-dirty", handleContentDirty);
  }, []);

  useEffect(() => {
    if (state.message === "saved") {
      setIsDirty(false);
      setLastSaved(new Date());
      router.refresh();
    }
  }, [state.message, router]);

  function addTagFromInput() {
    const newTags = tagInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (newTags.length === 0) return;
    setTags((prev) => [...new Set([...prev, ...newTags])]);
    setTagInput("");
    setIsDirty(true);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    setIsDirty(true);
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTagFromInput();
    }
  }

  return (
    <>
      <form
        action={formAction}
        onChange={() => setIsDirty(true)}
        onSubmit={() => window.dispatchEvent(new CustomEvent("entity-save"))}
        className="mb-6"
      >
        {/* Tags submitted as comma-separated hidden input */}
        <input type="hidden" name="tags" value={tags.join(",")} />

        <div className="flex gap-6">
          {/* Image */}
          {(entity.imageUrl || true) && (
            <div className="shrink-0 w-44">
              <ImageUpload
                name="imageUrl"
                currentUrl={entity.imageUrl}
                currentPosition={entity.imagePosition}
                onPositionChange={() => setIsDirty(true)}
              />
            </div>
          )}

          {/* Info + fields */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Name + actions row */}
            <div className="flex items-start gap-3">
              <input
                name="name"
                defaultValue={entity.name}
                maxLength={100}
                className="flex-1 min-w-0 text-2xl font-semibold bg-transparent border-0 outline-none p-0 leading-tight -mx-0.5 px-0.5 rounded hover:bg-muted/40 focus:bg-muted/40 transition-colors placeholder:text-muted-foreground/40"
                placeholder="Entity name"
              />
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {lastSaved && !isDirty && (
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <Button type="submit" size="sm" disabled={!isDirty || pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                  aria-label={`Delete ${entity.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            {/* Type + visibility */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <DynamicIcon
                  name={entityType.icon ?? ""}
                  size={13}
                  className="text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">{entityType.name}</span>
              </div>
              {isPublicWorld && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={visibilityPending}
                  onClick={handleToggleVisibility}
                  className={`h-7 gap-1.5 text-xs ${isHidden ? "text-muted-foreground" : "text-muted-foreground"}`}
                >
                  {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isHidden ? "Hidden" : "Visible"}
                </Button>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-0.5 cursor-pointer"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTagFromInput}
                placeholder={tags.length === 0 ? "Add tags…" : "Add…"}
                className="text-xs bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/40 w-16 min-w-0 p-0"
              />
            </div>

            {/* Custom fields */}
            {entityType.customFieldsSchema.fields.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <CustomFieldsForm
                  fields={entityType.customFieldsSchema.fields}
                  defaultValues={entity.customFields as CustomFieldValues}
                />
              </div>
            )}
          </div>
        </div>

        {state.errors?.name && (
          <p className="text-sm text-destructive mt-2">{state.errors.name[0]}</p>
        )}
      </form>

      <DeleteEntityDialog
        entity={entity}
        worldId={worldId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
