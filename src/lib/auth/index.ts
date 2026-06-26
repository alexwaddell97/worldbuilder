// Server-side Better Auth instance.
// NEVER import this file in Client Components ('use client').
// It reads server-only env vars and configures server-side session handling.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import * as authSchema from "@/lib/db/auth-schema";
import { sendVerificationEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { ...schema, ...authSchema } }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    "https://subcreation.app",
    "https://www.subcreation.app",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      const parsed = new URL(url);
      const callbackURL = parsed.searchParams.get("callbackURL") ?? "/dashboard";
      const base = callbackURL === "/" ? "/dashboard" : callbackURL;
      const separator = base.includes("?") ? "&" : "?";
      parsed.searchParams.set("callbackURL", `${base}${separator}verified=true`);
      await sendVerificationEmail(user.email, parsed.toString());
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  appName: "Subcreation",
  plugins: [nextCookies(), twoFactor({ issuer: "Subcreation" })],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
