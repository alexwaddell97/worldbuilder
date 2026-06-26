"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "totp" | "backup";

export default function TwoFactorPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === "totp") {
        const result = await authClient.twoFactor.verifyTotp({ code, trustDevice });
        if (result.error) {
          setError(result.error.message ?? "Invalid code. Please try again.");
        } else {
          router.push("/dashboard");
        }
      } else {
        const result = await authClient.twoFactor.verifyBackupCode({ code, trustDevice });
        if (result.error) {
          setError(result.error.message ?? "Invalid backup code.");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Two-factor verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your backup codes."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">{mode === "totp" ? "Authentication code" : "Backup code"}</Label>
          <Input
            id="code"
            type="text"
            inputMode={mode === "totp" ? "numeric" : "text"}
            autoComplete="one-time-code"
            placeholder={mode === "totp" ? "000000" : "xxxx-xxxx"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={mode === "totp" ? 6 : 20}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="trust-device"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="trust-device" className="text-sm font-normal cursor-pointer">
            Trust this device for 30 days
          </Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying…" : "Verify"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        {mode === "totp" ? (
          <button
            type="button"
            onClick={() => { setMode("backup"); setCode(""); setError(null); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a backup code instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMode("totp"); setCode(""); setError(null); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Use authenticator app instead
          </button>
        )}
      </div>
    </div>
  );
}
