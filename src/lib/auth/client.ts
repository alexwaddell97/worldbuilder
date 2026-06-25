// Client-side Better Auth helpers for use in React Client Components.
// Do NOT import anything from src/lib/auth/index.ts here — that is server-only.
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
  ],
});

export const { useSession, signIn, signOut, signUp } = authClient;
