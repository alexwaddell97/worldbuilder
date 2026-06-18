"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, authClient } from "@/lib/auth/client";

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
    await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" });
    setResendSent(true);
    setShowResend(false);
  }

  return (
    <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back to Worldbuilder
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => signIn.social({ provider: "google" })}
        type="button"
      >
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">or</span>
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
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                Resend verification email →
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
        <Link href="/signup" className="text-foreground hover:underline font-medium">
          Sign up →
        </Link>
      </p>
    </div>
  );
}
