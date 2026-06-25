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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
  Undo2,
  Redo2,
  FileCode2,
  HelpCircle,
  Link2,
} from "lucide-react";

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
  const [markdownContent, setMarkdownContent] = useState("");
  const isSwitchingRef = useRef(false);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const autocompleteRef = useRef<WikilinkAutocompleteHandle>(null);
  const [suggestionProps, setSuggestionProps] = useState<SuggestionPopupState | null>(null);

  const save = useCallback(
    async (content: unknown) => {
      setSaveStatus("saving");
      try {
        // Round-trip through JSON to convert ProseMirror's null-prototype attr
        // objects into plain objects React's server action serializer can handle.
        // Without this, attrs become "$T" in the flight protocol payload.
        const serializable = JSON.parse(JSON.stringify(content));
        await saveEntityContentAction(entityId, worldId, serializable);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [entityId, worldId]
  );

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor: e }) { (editorRef as React.MutableRefObject<typeof e>).current = e; },
    onUpdate({ editor: e }) { (editorRef as React.MutableRefObject<typeof e>).current = e; },
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
      // Don't save on blur if we're switching modes — the mode switch handles saving
      if (isSwitchingRef.current) return;
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
    isSwitchingRef.current = true;
    if (!isMarkdownMode) {
      // Rich text → Markdown: serialise current content to markdown string
      const md: string = (editor as any).getMarkdown?.() ?? "";
      setMarkdownContent(md);
      setIsMarkdownMode(true);
    } else {
      // Markdown → Rich text: parse markdown string back into JSON then load it
      const json = (editor as any).markdown?.parse?.(markdownContent);
      if (json) {
        editor.commands.setContent(json);
        save(editor.getJSON());
      }
      setIsMarkdownMode(false);
    }
    // Allow blur handler to fire normally again after this tick
    requestAnimationFrame(() => { isSwitchingRef.current = false; });
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // Flush any pending save when navigating away
      const currentEditor = editorRef.current;
      if (currentEditor) {
        const serializable = JSON.parse(JSON.stringify(currentEditor.getJSON()));
        saveEntityContentAction(entityId, worldId, serializable).catch(() => {});
      }
    };
  }, [entityId, worldId]);

  const saveStatusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Error saving"
          : null;

  return (
    <TooltipProvider delayDuration={400}>
    <div className="relative rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30 flex-wrap gap-y-1">
        {isMarkdownMode ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Markdown mode</span>
            </div>
            <MarkdownCheatsheet />
          </div>
        ) : (
          <div className="flex items-center gap-0.5 flex-wrap">
            {/* Undo / Redo */}
            <ToolbarButton label="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Headings */}
            <ToolbarButton label="Heading 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })}>
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Heading 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })}>
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Heading 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })}>
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Inline formatting */}
            <ToolbarButton label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")}>
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Inline code" onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive("code")}>
              <Code className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Block formatting */}
            <ToolbarButton label="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Ordered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Blockquote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Code block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock")}>
              <CodeSquare className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="Horizontal rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
              <Minus className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Wikilink */}
            <InsertWikilinkButton editor={editor} worldSlug={worldSlug} />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {saveStatusText && (
            <span className="text-xs text-muted-foreground">{saveStatusText}</span>
          )}
          <Button variant="ghost" size="sm" onClick={toggleMarkdown} className="h-7 text-xs gap-1.5">
            <FileCode2 className="h-3.5 w-3.5" />
            {isMarkdownMode ? "Rich text" : "Markdown"}
          </Button>
        </div>
      </div>

      {/* Editor or markdown textarea */}
      {isMarkdownMode ? (
        <textarea
          className="w-full min-h-50 p-4 text-sm font-mono bg-background resize-none focus:outline-none"
          value={markdownContent}
          onChange={(e) => {
            setMarkdownContent(e.target.value);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              if (!editor) return;
              const json = (editor as any).markdown?.parse?.(e.target.value);
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
    </TooltipProvider>
  );
}

import { DynamicIcon } from "@/components/entity-types/icon-picker";

type EntityTypeFilter = { id: string; name: string; icon: string | null; slug: string };
type AutocompleteResult = { id: string; name: string; slug: string; entityTypeId: string; entityTypeName: string; entityTypeIcon: string | null };

function InsertWikilinkButton({ editor, worldSlug }: { editor: ReturnType<typeof useEditor>; worldSlug: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [entityTypes, setEntityTypes] = useState<EntityTypeFilter[]>([]);
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchResults(q: string, typeId: string | null) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (typeId) params.set("typeId", typeId);
      const res = await fetch(`/api/worlds/${worldSlug}/entities/autocomplete?${params}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value, selectedTypeId), 200);
  }

  function handleTypeFilter(typeId: string | null) {
    setSelectedTypeId(typeId);
    fetchResults(query, typeId);
  }

  function insertWikilink(item: AutocompleteResult) {
    editor?.chain().focus().insertContent({
      type: "wikilink",
      attrs: { id: item.id, label: item.name, dead: false },
    }).run();
    setOpen(false);
    setQuery("");
    setSelectedTypeId(null);
    setResults([]);
  }

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setSelectedTypeId(null);
      setResults([]);
    } else {
      const [typesRes] = await Promise.all([
        fetch(`/api/worlds/${worldSlug}/entity-types`),
      ]);
      if (typesRes.ok) setEntityTypes(await typesRes.json());
      fetchResults("", null);
    }
  }

  // Group results by entity type for display
  const grouped = results.reduce<Record<string, AutocompleteResult[]>>((acc, r) => {
    (acc[r.entityTypeId] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-active={editor?.isActive("wikilink")}
          className="inline-flex items-center justify-center h-7 rounded-sm px-2 gap-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground cursor-pointer"
          aria-label="Insert wikilink"
        >
          <Link2 className="h-4 w-4" />
          <span>Wikilink</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-2">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Insert wikilink</p>

        <Input
          placeholder="Search entities…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="h-8 text-sm mb-2"
          autoFocus
        />

        {/* Entity type filter pills */}
        {entityTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 px-0.5">
            <button
              type="button"
              onClick={() => handleTypeFilter(null)}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                selectedTypeId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              All
            </button>
            {entityTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeFilter(t.id)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  selectedTypeId === t.id
                    ? "bg-primary text-primary-foreground border-primary cursor-pointer"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                }`}
              >
                {t.icon && <DynamicIcon name={t.icon} size={11} />}
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-52 overflow-y-auto">
          {loading && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">No entities found</p>
          )}
          {!loading && selectedTypeId !== null && results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => insertWikilink(item)}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              {item.name}
            </button>
          ))}
          {!loading && selectedTypeId === null && Object.entries(grouped).map(([typeId, items]) => {
            const type = entityTypes.find((t) => t.id === typeId);
            return (
              <div key={typeId} className="mb-1">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  {type?.icon && <DynamicIcon name={type.icon} size={11} className="text-muted-foreground" />}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{type?.name ?? "Unknown"}</span>
                </div>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertWikilink(item)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MarkdownCheatsheet() {
  const sections = [
    {
      title: "Headings",
      rows: [
        ["# Heading 1", "H1"],
        ["## Heading 2", "H2"],
        ["### Heading 3", "H3"],
      ],
    },
    {
      title: "Inline",
      rows: [
        ["**bold**", "Bold"],
        ["*italic*", "Italic"],
        ["~~strikethrough~~", "Strikethrough"],
        ["`code`", "Inline code"],
      ],
    },
    {
      title: "Links & Wikilinks",
      rows: [
        ["[text](url)", "Hyperlink"],
        ["[[Entity Name]]", "Wikilink to entity"],
      ],
    },
    {
      title: "Blocks",
      rows: [
        ["- item", "Bullet list"],
        ["1. item", "Ordered list"],
        ["> quote", "Blockquote"],
        ["```\\ncode\\n```", "Code block"],
        ["---", "Horizontal rule"],
      ],
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1.5 py-1 hover:bg-accent cursor-pointer"
          aria-label="Markdown help"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Help</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-3">
        <p className="text-xs font-semibold mb-2.5">Markdown reference</p>
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{section.title}</p>
              <div className="space-y-0.5">
                {section.rows.map(([syntax, label]) => (
                  <div key={syntax} className="flex items-center justify-between gap-2">
                    <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono text-foreground">{syntax}</code>
                    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="h-5 mx-0.5" />;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ label, onClick, active, disabled, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-active={active}
          className="inline-flex items-center justify-center h-7 w-7 rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground cursor-pointer"
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
