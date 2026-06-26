import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#eeece7", backgroundImage: "linear-gradient(rgba(238,236,231,0.6), rgba(238,236,231,0.6)), url('/topography.svg')" }}
    >
      <Link href="/" className="mb-10 opacity-80 hover:opacity-100 transition-opacity">
        <AppWordmark height={24} />
      </Link>

      <p className="text-[8rem] font-bold leading-none text-muted-foreground/20 select-none tabular-nums">
        404
      </p>

      <h1 className="text-xl font-semibold mt-4 -translate-y-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        This page doesn&apos;t exist or may have been moved.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Back to home
      </Link>
    </div>
  );
}
