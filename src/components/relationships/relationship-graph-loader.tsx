"use client";

import dynamic from "next/dynamic";
import type { RelationshipGraphProps } from "./relationship-graph";

// ssr: false is only valid inside a Client Component
import { SparkleLoaderScreen } from "@/components/ui/sparkle-loader";

const RelationshipGraph = dynamic(
  () => import("./relationship-graph").then((m) => m.RelationshipGraph),
  {
    ssr: false,
    loading: () => <SparkleLoaderScreen />,
  }
);

export function RelationshipGraphLoader(props: RelationshipGraphProps) {
  return <RelationshipGraph {...props} />;
}
