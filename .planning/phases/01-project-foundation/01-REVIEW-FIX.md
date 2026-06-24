---
phase: "01"
iteration: 1
fix_scope: critical_warning
status: all_fixed
findings_in_scope: 10
fixed: 10
skipped: 0
fixed_at: 2026-06-19
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-06-19
**Source review:** .planning/phases/01-project-foundation/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (3 Critical + 7 Warning)
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-001 — Tailwind v4 `@theme` bridge block missing

**Files modified:** `src/app/globals.css`
**Commit:** 4bee7ad
**Applied fix:** Added `@theme inline { }` block immediately after `@import "tailwindcss"`, mapping all 19 shadcn/ui design tokens (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, and their `-foreground` counterparts) to `--color-*` Tailwind v4 utility names. This makes `bg-background`, `text-foreground`, `bg-primary`, and all other semantic color utilities produce actual CSS output.

---

### CR-002 — Unsanitized `url` parameter interpolated into HTML email body

**Files modified:** `src/lib/email.ts`
**Commit:** 30141e0
**Applied fix:** Added `safeHref()` helper that validates the URL's origin against the expected domain (`APP_DOMAIN` env var, defaulting to `odinsarchive.com`) and HTML-encodes `&` and `"` characters before interpolating into the `href` attribute. Throws if the URL is invalid or from an unexpected origin.

---

### CR-003 — Email send errors silently swallowed

**Files modified:** `src/lib/email.ts`
**Commit:** 30141e0
**Applied fix:** Destructured `{ error }` from `resend.emails.send()` return value and added an `if (error) throw` guard. If Resend rejects the request for any reason (invalid API key, rate limit, domain not verified), the error now propagates to Better Auth's hook caller rather than silently succeeding. Combined in same commit as CR-002 since both affect the same function.

---

### WR-001 — `worlds.updatedAt` column has no `.$onUpdate()` hook

**Files modified:** `src/lib/db/schema.ts`
**Commit:** 1cf7ab9
**Applied fix:** Added `.$onUpdate(() => new Date())` to the `updatedAt` column definition, matching the pattern used by all Better Auth auth tables. Note: a new Drizzle migration is needed to apply this to an existing database (the ORM hook is a client-side concern, not a DB-level trigger, but the schema change signals intent to future migration tooling).

---

### WR-002 — `handleResend` in login page has no error handling and no loading state

**Files modified:** `src/app/(auth)/login/page.tsx`
**Commit:** b4138c9
**Applied fix:** Wrapped `authClient.sendVerificationEmail()` in try/catch with `setIsLoading(true/false)` in the finally block. Checks `result?.error` and throws if present. Surfaces failures via `setError()`. Also disabled the resend button during in-flight requests with `disabled={isLoading}` and added visual feedback ("Sending…" text while loading).

---

### WR-003 — `handleSignOut` in sidebar has no error handling

**Files modified:** `src/components/layout/sidebar.tsx`
**Commit:** 9aad1d0
**Applied fix:** Wrapped `signOut()` in try/catch that logs errors to `console.error`. Navigation to `/login` is moved to `finally` so it always executes regardless of whether server-side session invalidation succeeded. This prevents the session cookie from remaining valid while the user is stuck on the sign-out screen.

---

### WR-004 — Middleware matcher runs on every non-static route; missing `/api/` exclusion

**Files modified:** `src/proxy.ts` (new), `src/middleware.ts` (deleted)
**Commit:** cfa6988
**Applied fix:** Migrated `src/middleware.ts` to `src/proxy.ts` with a named `proxy` export, following the Next.js 16 convention (middleware is renamed to "Proxy" in Next.js 16). Removed the two redundant matcher entries (`"/"` and `"/dashboard/:path*"`) since they are covered by the catch-all pattern. Updated the exclusion list to exclude all `/api/` routes (was `api/auth` only) so future route handlers do not incur unnecessary session DB round-trips.

---

### WR-005 — PII (email address) logged to server console in production

**Files modified:** `src/lib/email.ts`
**Commit:** 30141e0
**Applied fix:** Removed all four debug `console.log` calls from the function, including the PII-containing line that logged the recipient email address and the line that leaked the `EMAIL_FROM` env var value. Addressed in the same commit as CR-002/CR-003 since the entire function was rewritten. Errors now throw (CR-003) rather than being logged.

---

### WR-006 — `schema` named export collides with the module namespace

**Files modified:** `src/lib/db/schema.ts`
**Commit:** 0826794
**Applied fix:** Renamed `export const schema` to `export const appSchema` and added an `export type AppSchema = typeof appSchema` type alias. All existing callers (`src/lib/db/index.ts`, `src/lib/auth/index.ts`) use `import * as schema` namespace imports and are unaffected by the rename.

---

### WR-007 — `bg-background/80` produces no CSS (depends on CR-001)

**Files modified:** `src/app/globals.css` (via CR-001 fix)
**Commit:** 4bee7ad
**Applied fix:** No independent code change needed. WR-007 is resolved as a direct consequence of the CR-001 fix — once `--color-background` is defined in `@theme inline`, the opacity modifier `bg-background/80` resolves correctly and the frosted-glass effect in the marketing header will render as intended.

---

_Fixed: 2026-06-19_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
