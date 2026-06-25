import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <AppWordmark height={32} />
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
