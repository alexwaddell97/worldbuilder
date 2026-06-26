"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Copy } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type Step = "password" | "scan" | "backup-codes";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.enable({ password });
      if (result.error) {
        toast.error(result.error.message ?? "Could not start 2FA setup.");
      } else if (result.data) {
        setTotpURI(result.data.totpURI);
        setBackupCodes(result.data.backupCodes);
        setPassword("");
        setStep("scan");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({ code });
      if (result.error) {
        toast.error(result.error.message ?? "Invalid code. Please try again.");
      } else {
        setStep("backup-codes");
        toast.success("Two-factor authentication enabled.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard.");
  }

  return (
    <div className="px-4 py-6 sm:p-8 flex flex-col h-full">
      <Breadcrumb items={[
        { label: "Settings", href: "/settings" },
        { label: "Two-factor authentication" },
      ]} />
      <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-muted">
          <ShieldCheck size={20} className="text-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Set up two-factor authentication</h1>
          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(["password", "scan", "backup-codes"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
              ${step === s ? "bg-foreground text-background" : (["scan", "backup-codes"].indexOf(step) > ["scan", "backup-codes"].indexOf(s) || (step === "backup-codes" && s !== "backup-codes")) ? "bg-foreground/20 text-muted-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </div>
            {i < 2 && <div className="flex-1 h-px bg-border w-8" />}
          </div>
        ))}
        <div className="ml-2 text-xs text-muted-foreground">
          {step === "password" && "Verify identity"}
          {step === "scan" && "Scan QR code"}
          {step === "backup-codes" && "Save backup codes"}
        </div>
      </div>

      {/* Step 1: Password */}
      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Confirm your password</Label>
            <p className="text-xs text-muted-foreground">We need to verify it's you before enabling 2FA.</p>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying…" : "Continue"}
          </Button>
        </form>
      )}

      {/* Step 2: Scan QR + verify */}
      {step === "scan" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Scan with your authenticator app</Label>
            <p className="text-xs text-muted-foreground">Use Google Authenticator, Authy, or any TOTP app. Scan the QR code below.</p>
            <div className="flex justify-start mt-3">
              <div className="p-4 bg-white rounded-lg border border-border inline-block">
                <QRCode value={totpURI} size={160} />
              </div>
            </div>
          </div>
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Enter the 6-digit code</Label>
              <p className="text-xs text-muted-foreground">Enter the code shown in your authenticator app to confirm the setup.</p>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                className="tracking-widest text-center text-lg font-mono"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying…" : "Verify & activate"}
            </Button>
          </form>
        </div>
      )}

      {/* Step 3: Backup codes */}
      {step === "backup-codes" && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Save your backup codes</Label>
            <p className="text-xs text-muted-foreground">
              If you lose access to your authenticator app, use one of these codes to sign in. Each code can only be used once. Store them somewhere safe.
            </p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((c) => (
                <code key={c} className="text-xs font-mono bg-background border border-border px-3 py-2 rounded text-center">
                  {c}
                </code>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyBackupCodes}>
              <Copy size={14} />
              Copy all
            </Button>
          </div>
          <Button onClick={() => router.push("/dashboard")}>
            Done — go to dashboard
          </Button>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
