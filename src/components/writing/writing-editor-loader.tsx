"use client";

import dynamic from "next/dynamic";

const WritingEditor = dynamic(
  () => import("@/components/writing/writing-editor").then((m) => m.WritingEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-background/40 backdrop-blur-sm" />
    ),
  }
);

export function WritingEditorLoader(props: React.ComponentProps<typeof WritingEditor>) {
  return <WritingEditor {...props} />;
}
