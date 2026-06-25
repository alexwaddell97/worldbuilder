"use client";

import dynamic from "next/dynamic";
import type { RelationshipGraphProps } from "./relationship-graph";

// ssr: false is only valid inside a Client Component
const RelationshipGraph = dynamic(
  () => import("./relationship-graph").then((m) => m.RelationshipGraph),
  { ssr: false }
);

export function RelationshipGraphLoader(props: RelationshipGraphProps) {
  return <RelationshipGraph {...props} />;
}
