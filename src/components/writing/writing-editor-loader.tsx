"use client";

import dynamic from "next/dynamic";
import { SparkleLoaderScreen } from "@/components/ui/sparkle-loader";

const WritingEditor = dynamic(
  () => import("@/components/writing/writing-editor").then((m) => m.WritingEditor),
  {
    ssr: false,
    loading: () => <SparkleLoaderScreen />,
  }
);

export function WritingEditorLoader(props: React.ComponentProps<typeof WritingEditor>) {
  return <WritingEditor {...props} />;
}
