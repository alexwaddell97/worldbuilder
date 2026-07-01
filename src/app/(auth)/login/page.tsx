"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, authClient } from "@/lib/auth/client";
import { GoogleIcon } from "@/components/ui/google-icon";
import { ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setIsLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        const msg = result.error.message ?? "Invalid credentials. Please try again.";
        setError(msg);
        if (msg.toLowerCase().includes("verif")) {
          setShowResend(true);
        }
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setResendSent(false);
    setIsLoading(true);
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" });
      if (result?.error) throw new Error(result.error.message);
      setResendSent(true);
      setShowResend(false);
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => signIn.social({ provider: "google" })}
        type="button"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#eeece7] px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="text-sm text-destructive space-y-1">
            <p>{error}</p>
            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-foreground underline underline-offset-2 hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending…" : <span className="flex items-center gap-1">Resend verification email <ChevronRight size={12} /></span>}
              </button>
            )}
          </div>
        )}

        {resendSent && (
          <p className="text-sm text-muted-foreground">
            Verification email sent — check your inbox.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-foreground hover:underline font-medium inline-flex items-center gap-0.5">
          Sign up <ChevronRight size={12} />
        </Link>
      </p>
    </div>
  );
}
