import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { APP_COPYRIGHT_YEAR } from "@/config/app";
import { LogoLink } from "@/components/marketing/logo-link";
import { AnchorNavLink } from "@/components/marketing/anchor-nav-link";
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-10 bg-background/40 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoLink />
            <span className="hidden md:block w-px h-5 bg-border" />
            <span className="hidden md:block text-xs text-muted-foreground">
              Tolkien&apos;s word for the act of world-making.
            </span>
          </div>
          <nav className="flex items-center gap-4 md:gap-6">
            <AnchorNavLink
              href="/#features"
              anchor="features"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </AnchorNavLink>
            <AnchorNavLink
              href="/#data-ownership"
              anchor="data-ownership"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Data ownership
            </AnchorNavLink>
            <Link
              href="/pricing"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
            <MarketingMobileNav />
          </nav>
        </div>
      </header>
      <main className="marketing-content">{children}</main>
      <footer className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-lg text-foreground"><AppWordmark /></p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your world. Your data. Always.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a>
            <span className="flex items-center gap-1.5">© {APP_COPYRIGHT_YEAR} <AppWordmark height={16} /></span>
          </div>
        </div>
      </footer>
    </>
  );
}
