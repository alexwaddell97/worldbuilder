"use client";

import { useState } from "react";
import { Plus, ArrowLeft, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WorldForm } from "@/components/worlds/world-form";
import { createWorldAction } from "@/lib/actions/worlds";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { WORLD_PRESETS } from "@/lib/constants/entity-types";
import type { PresetId } from "@/lib/constants/entity-types";
import { cn } from "@/lib/utils";

const PRESET_ORDER: PresetId[] = ["fantasy", "sci-fi", "horror", "historical", "mythology", "fiction", "blank"];

export function CreateWorldDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"preset" | "details">("preset");
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep("preset");
      setSelectedPreset(null);
    }
  }

  function handlePresetConfirm() {
    if (selectedPreset) setStep("details");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          Create World
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl transition-all">
        {step === "preset" ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a preset</DialogTitle>
              <DialogDescription>
                Pick a starting point for your world&apos;s entity types. You can add, edit, or remove any of them later.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mt-1">
              {PRESET_ORDER.map((id) => {
                const preset = WORLD_PRESETS[id];
                const isSelected = selectedPreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedPreset(id)}
                    className={cn(
                      "relative flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-all hover:border-primary/60 hover:bg-accent/40 cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                    <DynamicIcon name={preset.icon} size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-tight">{preset.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                    </div>
                    {preset.entityTypes.length > 0 ? (
                      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border">
                        <p className="text-[10px] text-muted-foreground">
                          {preset.entityTypes.length} entity types
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Preview entity types"
                            >
                              <HelpCircle size={12} />
                            </span>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-44 p-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5 px-1">
                              Included types
                            </p>
                            <div className="space-y-0.5">
                              {preset.entityTypes.map((t) => (
                                <div key={t.slug} className="flex items-center gap-2 px-1 py-0.5">
                                  <DynamicIcon name={t.icon} size={12} className="text-muted-foreground shrink-0" />
                                  <span className="text-xs">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-auto pt-1 border-t border-border italic">
                        No types — start from scratch
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handlePresetConfirm} disabled={!selectedPreset}>
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("preset")}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                Name your world
              </DialogTitle>
              <DialogDescription>
                Using the <span className="font-medium text-foreground">{selectedPreset ? WORLD_PRESETS[selectedPreset].label : ""}</span> preset.
                A URL slug is generated automatically.
              </DialogDescription>
            </DialogHeader>
            <WorldForm
              action={createWorldAction}
              preset={selectedPreset ?? "blank"}
              submitLabel="Create World"
              pendingLabel="Creating..."
              onSuccess={() => handleOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
