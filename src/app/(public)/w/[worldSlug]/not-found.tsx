import Link from "next/link";
import { Compass } from "lucide-react";

export default function PublicWorldNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center h-full">
      <div className="text-muted-foreground/30 mb-6">
        <Compass size={56} strokeWidth={1} />
      </div>

      <p className="text-[6rem] font-bold leading-none text-muted-foreground/15 select-none tabular-nums">
        404
      </p>

      <h1 className="text-lg font-semibold -translate-y-1">Not found in this world</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        This page doesn&apos;t exist — it may have been hidden or removed.
      </p>
    </div>
  );
}
