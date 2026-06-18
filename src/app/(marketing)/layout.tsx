import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Worldbuilder
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#data-ownership"
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Data ownership
            </a>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-foreground bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
