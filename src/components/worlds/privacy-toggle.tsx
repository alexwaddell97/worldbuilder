"use client";

import { useOptimistic, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { togglePrivacyAction } from "@/lib/actions/worlds";

interface PrivacyToggleProps {
  worldId: string;
  isPublic: boolean;
}

export function PrivacyToggle({ worldId, isPublic }: PrivacyToggleProps) {
  const [optimistic, setOptimistic] = useOptimistic(isPublic);
  const [pending, startTransition] = useTransition();

  function handleChange() {
    startTransition(async () => {
      setOptimistic(!optimistic);
      await togglePrivacyAction(worldId);
    });
  }

  return (
    <Switch
      checked={optimistic}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label="Toggle world privacy"
    />
  );
}
