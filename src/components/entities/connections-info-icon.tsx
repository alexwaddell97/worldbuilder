"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionsInfoIcon() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
            <Info size={11} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs leading-relaxed">
          <p><span className="font-semibold">→</span> this entity is the source of the relationship</p>
          <p className="mt-1"><span className="font-semibold">←</span> this entity is the target of the relationship</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
