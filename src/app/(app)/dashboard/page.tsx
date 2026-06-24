import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWorldsByOwner } from "@/lib/db/queries/worlds";
import { CreateWorldDialog } from "@/components/worlds/create-world-dialog";
import { WorldCard } from "@/components/worlds/world-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const worlds = await getWorldsByOwner(session.user.id);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your Worlds</h1>
        <CreateWorldDialog />
      </div>

      {worlds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-lg font-semibold">No worlds yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Create your first world to start building your universe.
          </p>
          <CreateWorldDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </div>
      )}
    </div>
  );
}
