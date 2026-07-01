import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { ChevronLeft } from "lucide-react";
import { AuthArtPanel } from "@/components/auth/auth-art-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <AuthArtPanel />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
            Home
          </Link>
        </div>
        <div className="rounded-xl border border-border shadow-lg px-8 py-8 bg-muted">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-end gap-2">
              <AppWordmark height={32} />
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none mb-0.5">
                Alpha
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
