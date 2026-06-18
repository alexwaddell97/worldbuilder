import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Placeholder — replaced by Plan 01-05 (full marketing landing page)
export default async function HomePage() {
  // D-04: authenticated users are redirected to /dashboard
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Worldbuilder</h1>
        <p className="mt-2 text-muted-foreground">Build richer worlds.</p>
      </div>
    </div>
  );
}
