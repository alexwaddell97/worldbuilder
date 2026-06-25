import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Lock, Globe } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { WorldDetailActions } from "./world-detail-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function WorldDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) notFound();

  const entityTypes = await getEntityTypesByWorld(world.id);

  return (
    <div className="p-8">
      <Breadcrumb items={[
        { label: "Your Worlds", href: "/dashboard" },
        { label: world.name },
      ]} />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{world.name}</h1>
        <WorldDetailActions world={world} />
      </div>

      {/* Description */}
      {world.description && (
        <p className="text-sm text-muted-foreground max-w-prose mt-2 mb-6">
          {world.description}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-3 mb-8 mt-4">
        <Badge variant="outline" className="text-muted-foreground gap-1">
          {world.isPublic ? (
            <>
              <Globe size={12} />
              Public
            </>
          ) : (
            <>
              <Lock size={12} />
              Private
            </>
          )}
        </Badge>
        <span className="font-mono text-sm text-muted-foreground">
          /worlds/{world.slug}
        </span>
      </div>

      <Separator />

      {/* Entity types quick nav */}
      <div className="mt-8">
        <h2 className="text-base font-semibold mb-3">Entity Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {entityTypes.map((type) => (
            <Link
              key={type.id}
              href={`/worlds/${world.slug}/entities/${type.slug}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-center"
            >
              <DynamicIcon
                name={type.icon ?? ""}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">{type.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
