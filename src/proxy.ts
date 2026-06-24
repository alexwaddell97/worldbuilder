import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Next.js 16: middleware.ts is renamed to proxy.ts.
// The function export is named `proxy` (or can be a default export).
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const session = await auth.api.getSession({ headers: request.headers });

  // Authenticated users hitting root → send to dashboard (D-04)
  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected paths: require authenticated session
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/worlds");
  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes that need session inspection, excluding:
     *   - Next.js internals (_next/static, _next/image)
     *   - Static root assets (favicon.ico)
     *   - All API routes (/api/*) — each route handler performs its own
     *     auth check; running getSession in proxy for API routes adds
     *     an unnecessary DB round-trip on every request.
     *
     * The previous entries "/" and "/dashboard/:path*" were redundant given
     * this pattern and have been removed to avoid confusion.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
