import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <AppIcon size={20} />
            ← Home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
