import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { APP_COPYRIGHT_YEAR } from "@/config/app";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <main id="main-content" className="marketing-content">{children}</main>
      <footer className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div><AppWordmark /></div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your world. Your data. Always.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a>
            <span className="flex items-center gap-1.5">© {APP_COPYRIGHT_YEAR} <AppWordmark height={16} alt="" /></span>
          </nav>
        </div>
      </footer>
    </>
  );
}
