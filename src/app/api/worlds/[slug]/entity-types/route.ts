import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntityTypesByWorld } from "@/lib/db/queries/entity-types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const world = await getWorldBySlug(slug, session.user.id);
  if (!world) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const types = await getEntityTypesByWorld(world.id);
  return Response.json(
    types.map((t) => ({ id: t.id, name: t.name, icon: t.icon, slug: t.slug }))
  );
}
