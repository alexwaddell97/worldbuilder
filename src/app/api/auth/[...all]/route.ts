// Better Auth catch-all route handler.
// Handles all auth HTTP operations: sign in, sign up, OAuth callbacks,
// email verification, session refresh, sign out, etc.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
