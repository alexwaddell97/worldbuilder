import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const session = await auth.api.getSession({ headers: request.headers });

  // Authenticated users hitting root → send to dashboard (D-04)
  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected paths: require authenticated session
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match root and dashboard paths.
     * Exclude Next.js internals, static assets, and the auth API itself
     * (calling getSession on auth API routes causes an infinite loop).
     */
    "/",
    "/dashboard/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
