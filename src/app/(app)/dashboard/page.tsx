import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="p-8">
      <div className="mb-1">
        <p className="text-sm text-muted-foreground">
          {session?.user.name} · {session?.user.email}
        </p>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Your Worlds
      </h1>
      <p className="text-muted-foreground text-sm">
        You don&apos;t have any worlds yet. World management comes in Phase 2.
      </p>
    </div>
  );
}
