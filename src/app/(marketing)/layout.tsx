import Link from "next/link";
import { AppWordmark } from "@/components/ui/app-wordmark";
import { APP_COPYRIGHT_YEAR } from "@/config/app";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ArtAttribution } from "@/components/ui/art-attribution";

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
            <div className="flex items-center gap-3 mt-3">
              <p className="text-xs text-muted-foreground">© {APP_COPYRIGHT_YEAR} Subcreation</p>
              <a
                href="https://discord.gg/d4nYK9nZG8"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join our Discord"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
              </a>
            </div>
            <div className="mt-1.5">
              <ArtAttribution className="text-muted-foreground hover:text-foreground" />
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-10 gap-y-6 text-sm text-muted-foreground">
            <nav aria-label="Updates" className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Updates</p>
              <Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link>
              <Link href="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link>
              <Link href="/announcements" className="hover:text-foreground transition-colors">Announcements</Link>
            </nav>
            <nav aria-label="Legal" className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Legal</p>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
