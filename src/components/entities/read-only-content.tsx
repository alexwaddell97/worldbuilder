"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { WikilinkExtension } from "@/lib/tiptap/wikilink-extension";

interface ReadOnlyContentProps {
  content: unknown;
  onWikilinkClick?: (entityId: string) => void;
}

export function ReadOnlyContent({ content, onWikilinkClick }: ReadOnlyContentProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Markdown, WikilinkExtension.configure({ onWikilinkClick })],
    content: content ?? "",
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
      },
    },
  });

  if (!content) {
    return <p className="text-sm text-muted-foreground italic">No content yet.</p>;
  }

  return <EditorContent editor={editor} />;
}
