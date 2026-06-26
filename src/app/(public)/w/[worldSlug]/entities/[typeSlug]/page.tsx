import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  getPublicWorldBySlug,
  getPublicEntityTypeBySlug,
  getPublicEntitiesByType,
} from "@/lib/db/queries/public";
import { PublicEntityList } from "@/components/public/public-entity-list";
import { pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicEntityListPage({
  params,
}: {
  params: Promise<{ worldSlug: string; typeSlug: string }>;
}) {
  const { worldSlug, typeSlug } = await params;

  const world = await getPublicWorldBySlug(worldSlug);
  if (!world) notFound();

  const entityType = await getPublicEntityTypeBySlug(world.id, typeSlug);
  if (!entityType) notFound();

  const entities = await getPublicEntitiesByType(world.id, entityType.id);
  const basePath = `/w/${worldSlug}`;
  const typeName = entityType.namePlural ?? pluralize(entityType.name);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Breadcrumb items={[
        { label: world.name, href: basePath },
        { label: typeName },
      ]} />
      <h1 className="text-2xl font-bold mb-6">{typeName}</h1>

      <PublicEntityList
        entities={entities}
        typeSlug={typeSlug}
        typeName={typeName}
        basePath={basePath}
      />
    </div>
  );
}
