import { getPublicWorldBySlug } from "@/lib/db/queries/public";
import { searchPublicWorld } from "@/lib/db/queries/search";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worldSlug: string }> }
) {
  const { worldSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await searchPublicWorld(world.id, q);

  return Response.json(results);
}
