import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundColor: "#eeece7",
        backgroundImage: "linear-gradient(rgba(238,236,231,0.6), rgba(238,236,231,0.6)), url('/topography.svg')",
      }}
    >

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-end gap-2">
            <AppWordmark height={32} />
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none mb-0.5">
              Alpha
            </span>
          </Link>
        </div>
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
            Home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
