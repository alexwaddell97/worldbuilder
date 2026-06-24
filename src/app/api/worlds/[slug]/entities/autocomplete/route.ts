import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWorldBySlug } from "@/lib/db/queries/worlds";
import { getEntitiesForAutocomplete } from "@/lib/db/queries/entities";

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

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await getEntitiesForAutocomplete(world.id, q);

  return Response.json(results);
}
