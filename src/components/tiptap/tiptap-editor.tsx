"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { WikilinkExtension } from "@/lib/tiptap/wikilink-extension";
import { saveEntityContentAction } from "@/lib/actions/entities";
import { WikilinkAutocomplete } from "@/components/tiptap/wikilink-autocomplete";
import type { WikilinkAutocompleteHandle } from "@/components/tiptap/wikilink-autocomplete";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  entityId: string;
  worldId: string;
  worldSlug: string;
  initialContent: unknown;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SuggestionPopupState {
  items: Array<{ id: string; name: string; slug: string }>;
  command: (item: { id: string; name: string }) => void;
  selectedIndex: number;
  popupRect: DOMRect | null;
}

export function TiptapEditor({
  entityId,
  worldId,
  worldSlug,
  initialContent,
}: TiptapEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [, startTransition] = useTransition();
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const markdownRef = useRef<string>("");
  const autocompleteRef = useRef<WikilinkAutocompleteHandle>(null);
  const [suggestionProps, setSuggestionProps] = useState<SuggestionPopupState | null>(null);

  const save = useCallback(
    async (content: unknown) => {
      setSaveStatus("saving");
      try {
        startTransition(async () => {
          await saveEntityContentAction(entityId, worldId, content);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        });
      } catch {
        setSaveStatus("error");
      }
    },
    [entityId, worldId, startTransition]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      WikilinkExtension.configure({
        suggestion: {
          char: "[[",
          items: async ({ query }: { query: string }) => {
            const res = await fetch(
              `/api/worlds/${worldSlug}/entities/autocomplete?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) return [];
            return res.json();
          },
          render: () => ({
            onStart: (props: any) => {
              setSuggestionProps({
                items: props.items,
                command: props.command,
                selectedIndex: 0,
                popupRect: props.clientRect?.() ?? null,
              });
            },
            onUpdate: (props: any) => {
              setSuggestionProps((prev) =>
                prev
                  ? {
                      ...prev,
                      items: props.items,
                      command: props.command,
                      popupRect: props.clientRect?.() ?? prev.popupRect,
                    }
                  : null
              );
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) =>
              autocompleteRef.current?.onKeyDown(event) ?? false,
            onExit: () => setSuggestionProps(null),
          }),
        },
      }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
    onBlur: ({ editor: e }: any) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      save(e.getJSON());
    },
    onUpdate: ({ editor: e }: any) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => save(e.getJSON()), 2000);
    },
  });

  function toggleMarkdown() {
    if (!editor) return;
    if (!isMarkdownMode) {
      markdownRef.current = (editor as any).getMarkdown?.() ?? "";
      setIsMarkdownMode(true);
    } else {
      const json = (editor.storage.markdown as any)?.manager?.parse(
        markdownRef.current
      );
      if (json) {
        editor.commands.setContent(json);
      }
      setIsMarkdownMode(false);
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const saveStatusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Error saving"
          : null;

  return (
    <div className="relative rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div />
        <div className="flex items-center gap-2">
          {saveStatusText && (
            <span className="text-xs text-muted-foreground">{saveStatusText}</span>
          )}
          <Button variant="ghost" size="sm" onClick={toggleMarkdown}>
            {isMarkdownMode ? "Rich text" : "Markdown"}
          </Button>
        </div>
      </div>

      {/* Editor or markdown textarea */}
      {isMarkdownMode ? (
        <textarea
          className="w-full min-h-[200px] p-4 text-sm font-mono bg-background resize-none focus:outline-none"
          value={markdownRef.current}
          onChange={(e) => {
            markdownRef.current = e.target.value;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              const json = (editor?.storage.markdown as any)?.manager?.parse(
                markdownRef.current
              );
              if (json) save(json);
            }, 2000);
          }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* Wikilink autocomplete dropdown */}
      {suggestionProps !== null &&
        suggestionProps.popupRect !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: suggestionProps.popupRect.bottom + 4,
              left: suggestionProps.popupRect.left,
              zIndex: 50,
            }}
          >
            <WikilinkAutocomplete
              ref={autocompleteRef}
              items={suggestionProps.items}
              command={suggestionProps.command}
              selectedIndex={suggestionProps.selectedIndex}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
