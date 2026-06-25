"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/auth";

interface SettingsClientProps {
  user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();

  // Profile
  const [name, setName] = useState(user.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    const result = await authClient.updateUser({ name });
    setProfileSaving(false);
    if (result.error) {
      toast.error(result.error.message ?? "Failed to save profile.");
    } else {
      toast.success("Profile updated.");
      router.refresh();
    }
  }

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("New passwords do not match."); return; }
    if (newPassword.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setPasswordSaving(true);
    const result = await authClient.changePassword({ currentPassword, newPassword });
    setPasswordSaving(false);
    if (result.error) {
      toast.error(result.error.message ?? "Could not update password.");
    } else {
      toast.success("Password updated.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
  }

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(!!(user as { twoFactorEnabled?: boolean }).twoFactorEnabled);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setDisabling(true);
    const result = await authClient.twoFactor.disable({ password: disablePassword });
    setDisabling(false);
    if (result.error) {
      toast.error(result.error.message ?? "Could not disable 2FA.");
    } else {
      setTwoFAEnabled(false);
      setShowDisableForm(false);
      setDisablePassword("");
      toast.success("Two-factor authentication disabled.");
      router.refresh();
    }
  }

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleteConfirm !== "delete my account") return;
    setDeleting(true);
    const result = await authClient.deleteUser();
    if (result.error) {
      setDeleting(false);
      toast.error(result.error.message ?? "Failed to delete account.");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex gap-4">
      {/* Left column: Profile + Plan */}
      <div className="flex flex-col gap-4 flex-1">
        {/* Profile */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Profile</h2>
          <p className="text-xs text-muted-foreground mb-4">Update your display name.</p>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email changes are not supported yet.</p>
            </div>
            <Button type="submit" disabled={profileSaving} size="sm">
              {profileSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </div>

        {/* Plan */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Plan</h2>
          <p className="text-xs text-muted-foreground mb-4">Your current subscription.</p>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Scribe</p>
              <p className="text-xs text-muted-foreground mt-0.5">Free plan</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/pricing">Upgrade</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Subscription management will be available once billing is set up.</p>
        </div>
      </div>

      {/* Right column: Security + Danger */}
      <div className="flex flex-col gap-4 flex-1">
        {/* Security */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Security</h2>
          <p className="text-xs text-muted-foreground mb-4">Manage your password and two-factor authentication.</p>
          <div className="space-y-3">
            {/* Password */}
            <div className="rounded-md border border-border p-3">
              <form onSubmit={handlePasswordSave} className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="current-password">Current password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="new-password">New password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="8+ characters" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="confirm-password">Confirm</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" disabled={passwordSaving} size="sm">
                  {passwordSaving ? "Updating…" : "Update password"}
                </Button>
              </form>
            </div>

            {/* 2FA */}
            <div className="rounded-md border border-border p-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {twoFAEnabled ? "Your account is protected with an authenticator app." : "Add an extra layer of security to your account."}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border border-border bg-muted font-medium text-foreground">
                    {twoFAEnabled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    {twoFAEnabled ? "Enabled" : "Not enabled"}
                  </span>
                  {twoFAEnabled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowDisableForm((v) => !v); setDisablePassword(""); }}
                    >
                      Disable
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/two-factor-setup">Set up</Link>
                    </Button>
                  )}
                </div>
              </div>

              {showDisableForm && (
                <form onSubmit={handleDisable2FA} className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Confirm your password to disable two-factor authentication.</p>
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="destructive" disabled={disabling}>
                      {disabling ? "Disabling…" : "Disable 2FA"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setShowDisableForm(false); setDisablePassword(""); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-card border border-destructive/30 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Danger zone</h2>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated worlds. This cannot be undone. Export your data first.
            </p>
            <div className="space-y-1">
              <Label htmlFor="delete-confirm" className="text-xs">
                Type <span className="font-mono font-medium text-foreground">delete my account</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete my account"
                className="border-destructive/40 focus-visible:ring-destructive"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteConfirm !== "delete my account" || deleting}
            >
              {deleting ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
