import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="px-4 py-6 sm:p-8 flex flex-col">
      <h1 className="text-xl font-semibold tracking-tight text-foreground mb-6">Account</h1>
      <SettingsClient user={session.user} />
    </div>
  );
}
