"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { WikilinkExtension } from "@/lib/tiptap/wikilink-extension";
import { WikilinkAutocomplete } from "@/components/tiptap/wikilink-autocomplete";
import type { WikilinkAutocompleteHandle } from "@/components/tiptap/wikilink-autocomplete";
import { saveWritingDocumentContentAction, updateWritingDocumentTitleAction, setWordTargetAction, togglePublishDocumentAction } from "@/lib/actions/writing";
import { getEntityWithTypeByIdAction } from "@/lib/actions/entities";
import { EntityPreviewDrawer } from "@/components/entities/entity-preview-drawer";
import type { Entity, EntityType } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, CodeSquare, Minus, Undo2, Redo2, Link2,
  Flag, AlignCenter, Target, Maximize2, Minimize2, Globe, Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WritingEditorProps {
  docId: string;
  worldId: string;
  worldSlug: string;
  initialTitle: string;
  initialContent: unknown;
  initialUpdatedAt?: Date | string | null;
  initialWordCount?: number;
  initialWordTarget?: number | null;
  initialIsPublished?: boolean;
  isPublicWorld?: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface SuggestionPopupState {
  items: Array<{ id: string; name: string; slug: string }>;
  command: (item: { id: string; name: string }) => void;
  selectedIndex: number;
  popupRect: DOMRect | null;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function WritingEditor({ docId, worldId, worldSlug, initialTitle, initialContent, initialUpdatedAt, initialWordCount = 0, initialWordTarget = null, initialIsPublished = false, isPublicWorld = false }: WritingEditorProps) {
  const router = useRouter();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [wordCount, setWordCount] = useState(initialWordCount);
  const [charCount, setCharCount] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null
  );
  const [, setTick] = useState(0);

  // Session goal
  const [sessionGoal, setSessionGoal] = useState<number | null>(null);
  const [goalReached, setGoalReached] = useState(false);
  const sessionStartWordsRef = useRef<number | null>(null);

  // Doc word target
  const [wordTarget, setWordTarget] = useState<number | null>(initialWordTarget);

  // Typewriter scroll
  const [typewriterMode, setTypewriterMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus mode
  const [focusMode, setFocusMode] = useState(false);

  // Publish state
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [publishPending, setPublishPending] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntity, setDrawerEntity] = useState<Entity | null>(null);
  const [drawerEntityType, setDrawerEntityType] = useState<EntityType | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Ref so Tiptap's captured option always delegates to the latest handler
  const wikilinkClickRef = useRef<(entityId: string) => void>(() => {});
  wikilinkClickRef.current = useCallback(async (entityId: string) => {
    setDrawerEntity(null);
    setDrawerEntityType(null);
    setDrawerLoading(true);
    setDrawerOpen(true);
    const result = await getEntityWithTypeByIdAction(worldId, entityId);
    if (result) {
      setDrawerEntity(result.entity);
      setDrawerEntityType(result.entityType);
    }
    setDrawerLoading(false);
  }, [worldId]);

  // Ref to always read latest wordCount inside save callback (avoids stale closure)
  const wordCountRef = useRef(wordCount);
  wordCountRef.current = wordCount;

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const autocompleteRef = useRef<WikilinkAutocompleteHandle>(null);
  const [suggestionProps, setSuggestionProps] = useState<SuggestionPopupState | null>(null);

  const saveContent = useCallback(async (content: unknown) => {
    setSaveStatus("saving");
    try {
      const serializable = JSON.parse(JSON.stringify(content));
      await saveWritingDocumentContentAction(docId, worldId, serializable, wordCountRef.current);
      setLastSavedAt(new Date());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [docId, worldId]);

  const updateCounts = useCallback((e: Editor) => {
    const text = e.getText();
    const wc = countWords(text);
    setWordCount(wc);
    setCharCount(text.length);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor: e }) {
      editorRef.current = e;
      updateCounts(e);
    },
    extensions: [
      StarterKit,
      Markdown,
      WikilinkExtension.configure({
        onWikilinkClick: (entityId: string) => wikilinkClickRef.current(entityId),
        suggestion: {
          char: "[[",
          items: (async ({ query }: { query: string }) => {
            const res = await fetch(
              `/api/worlds/${worldSlug}/entities/autocomplete?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) return [];
            return res.json();
          }) as unknown as () => Promise<{ id: string; name: string; slug: string }[]>,
          render: () => ({
            onStart: (props: any) => {
              setSuggestionProps({ items: props.items, command: props.command, selectedIndex: 0, popupRect: props.clientRect?.() ?? null });
            },
            onUpdate: (props: any) => {
              setSuggestionProps((prev) =>
                prev ? { ...prev, items: props.items, command: props.command, popupRect: props.clientRect?.() ?? prev.popupRect } : null
              );
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => autocompleteRef.current?.onKeyDown(event) ?? false,
            onExit: () => setSuggestionProps(null),
          }),
        },
      }),
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-base dark:prose-invert max-w-none focus:outline-none min-h-[60vh] leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }: any) => {
      editorRef.current = e;
      updateCounts(e);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveContent(e.getJSON()), 2000);
    },
    onBlur: ({ editor: e }: any) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveContent(e.getJSON());
    },
  });

  // Typewriter scroll — keep cursor at ~42% from top
  useEffect(() => {
    if (!editor || !typewriterMode) return;
    function scrollToCursor() {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { from } = editor!.state.selection;
      const coords = editor!.view.coordsAtPos(from);
      const rect = container.getBoundingClientRect();
      container.scrollTop = container.scrollTop + coords.top - rect.top - rect.height * 0.42;
    }
    editor.on("selectionUpdate", scrollToCursor);
    return () => { editor.off("selectionUpdate", scrollToCursor); };
  }, [editor, typewriterMode]);

  // Fire celebration when session goal is first crossed
  useEffect(() => {
    if (!sessionGoal || goalReached || sessionStartWordsRef.current === null) return;
    const written = Math.max(0, wordCount - sessionStartWordsRef.current);
    if (written >= sessionGoal) setGoalReached(true);
  }, [wordCount, sessionGoal, goalReached]);

  // Auto-resize title textarea
  useEffect(() => {
    const ta = titleRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [title]);

  // Re-render relative timestamp every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Sync focus mode with browser fullscreen
  useEffect(() => {
    if (focusMode) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [focusMode]);

  // When browser exits fullscreen (Esc key or system), mirror state
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setFocusMode(false);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function handleTitleBlur() {
    const trimmed = title.trim() || "Untitled";
    setTitle(trimmed);
    const result = await updateWritingDocumentTitleAction(docId, worldId, worldSlug, trimmed);
    if (result.success && result.slug) {
      router.replace(`/worlds/${worldSlug}/writing/${result.slug}`);
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const e = editorRef.current;
      if (e) {
        const serializable = JSON.parse(JSON.stringify(e.getJSON()));
        saveWritingDocumentContentAction(docId, worldId, serializable, wordCountRef.current).catch(() => {});
      }
    };
  }, [docId, worldId]);

  function handleSetSessionGoal(goal: number) {
    if (sessionStartWordsRef.current === null) {
      sessionStartWordsRef.current = wordCount;
    }
    setSessionGoal(goal);
    setGoalReached(false);
  }

  async function handleSetWordTarget(target: number | null) {
    setWordTarget(target);
    await setWordTargetAction(docId, worldId, worldSlug, target);
  }

  const sessionWordsWritten = sessionGoal !== null && sessionStartWordsRef.current !== null
    ? Math.max(0, wordCount - sessionStartWordsRef.current) : 0;
  const sessionProgress = sessionGoal ? Math.min(1, sessionWordsWritten / sessionGoal) : 0;
  const docProgress = wordTarget ? Math.min(1, wordCount / wordTarget) : 0;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const saveStatusText =
    saveStatus === "saving" ? "Saving…" :
    saveStatus === "saved" ? "Saved" :
    saveStatus === "error" ? "Error saving" : null;

  const editorShell = (
    <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-0.5 px-4 py-1.5 border-b border-border bg-background/60 backdrop-blur-sm flex-wrap">
          <ToolbarButton label="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarSeparator />
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
          {editor && <WritingWikilinkButton editor={editor} worldSlug={worldSlug} />}

          {saveStatusText && (
            <span className="ml-auto text-xs text-muted-foreground">{saveStatusText}</span>
          )}
        </div>

        {/* Content area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className={`max-w-3xl mx-auto px-4 py-6 sm:px-8 sm:py-10 ${typewriterMode ? "pb-[50vh]" : ""}`}>
            {/* Editable title */}
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
              placeholder="Untitled"
              rows={1}
              className="w-full text-3xl font-bold text-foreground bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/40 mb-6 leading-tight overflow-hidden"
            />
            {/* Editor */}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Status bar */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-2 border-t border-border text-xs text-muted-foreground bg-background/60">
          {/* Stats */}
          <span>{wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}</span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:inline">{charCount.toLocaleString()} chars</span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:inline">{readingMinutes} min read</span>

          <div className="flex-1" />

          {/* Session goal */}
          <SessionGoalButton
            sessionGoal={sessionGoal}
            sessionWordsWritten={sessionWordsWritten}
            sessionProgress={sessionProgress}
            goalReached={goalReached}
            onSetGoal={handleSetSessionGoal}
            onClearGoal={() => { setSessionGoal(null); setGoalReached(false); sessionStartWordsRef.current = null; }}
          />

          {/* Doc word target */}
          <DocTargetButton
            wordCount={wordCount}
            wordTarget={wordTarget}
            docProgress={docProgress}
            onSetTarget={handleSetWordTarget}
          />

          {/* Publish toggle — only shown when world is public */}
          {isPublicWorld && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled={publishPending}
                onClick={async () => {
                  setPublishPending(true);
                  try {
                    const { isPublished: next } = await togglePublishDocumentAction(docId, worldId, worldSlug);
                    setIsPublished(next);
                  } finally {
                    setPublishPending(false);
                  }
                }}
                className={`flex items-center gap-1 h-6 px-1.5 rounded transition-colors disabled:opacity-50 ${isPublished ? "text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20" : "hover:text-foreground hover:bg-muted"}`}
              >
                {isPublished ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{isPublished ? "Published" : "Draft"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isPublished ? "Click to unpublish (hide from public view)" : "Click to publish (visible in public world)"}
            </TooltipContent>
          </Tooltip>
          )}

          {/* Typewriter mode — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTypewriterMode((v) => !v)}
                className={`hidden sm:flex h-6 w-6 items-center justify-center rounded transition-colors ${typewriterMode ? "text-primary bg-primary/10" : "hover:text-foreground hover:bg-muted"}`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {typewriterMode ? "Disable typewriter scroll" : "Enable typewriter scroll"}
            </TooltipContent>
          </Tooltip>

          {/* Focus mode — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFocusMode((v) => !v)}
                className={`hidden sm:flex h-6 w-6 items-center justify-center rounded transition-colors ${focusMode ? "text-primary bg-primary/10" : "hover:text-foreground hover:bg-muted"}`}
              >
                {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {focusMode ? "Exit focus mode (Esc)" : "Focus mode"}
            </TooltipContent>
          </Tooltip>

          {/* Last saved — desktop only */}
          {lastSavedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden sm:inline cursor-default">Saved {formatRelativeTime(lastSavedAt)}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {formatAbsoluteTime(lastSavedAt)}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
  );

  if (focusMode && typeof document !== "undefined") {
    return createPortal(
      <TooltipProvider delayDuration={400}>
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {editorShell}
        </div>
      </TooltipProvider>,
      document.body
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      {editorShell}

      {/* Entity preview drawer */}
      <EntityPreviewDrawer
        entity={drawerEntity}
        entityType={drawerEntityType}
        worldSlug={worldSlug}
        open={drawerOpen}
        loading={drawerLoading}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Wikilink autocomplete */}
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
    </TooltipProvider>
  );
}

// ─── progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ progress, reached, size = 22, stroke = 2.5 }: { progress: number; reached: boolean; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - Math.min(progress, 1) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted-foreground/20" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className={`transition-all duration-500 ${reached ? "stroke-green-500" : "stroke-primary"}`}
      />
    </svg>
  );
}

// ─── session goal button ───────────────────────────────────────────────────────

const SESSION_PRESETS = [250, 500, 1000, 1500, 2000];

function SessionGoalButton({ sessionGoal, sessionWordsWritten, sessionProgress, goalReached, onSetGoal, onClearGoal }: {
  sessionGoal: number | null;
  sessionWordsWritten: number;
  sessionProgress: number;
  goalReached: boolean;
  onSetGoal: (n: number) => void;
  onClearGoal: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function submit(val: number) {
    if (val > 0) { onSetGoal(val); setOpen(false); setCustom(""); }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button className={`flex items-center gap-1.5 h-6 px-1.5 rounded transition-colors ${sessionGoal ? "hover:bg-muted" : "hover:text-foreground hover:bg-muted"}`}>
              {sessionGoal ? (
                <>
                  <ProgressRing progress={sessionProgress} reached={goalReached} />
                  <span className={`tabular-nums ${goalReached ? "text-green-500" : ""}`}>
                    {sessionWordsWritten.toLocaleString()}/{sessionGoal.toLocaleString()}
                  </span>
                </>
              ) : (
                <Flag className="h-3.5 w-3.5" />
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {sessionGoal ? "Session goal" : "Set session goal"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="top" align="end" className="w-52 p-3 space-y-3">
        <p className="text-xs font-medium">Session goal</p>
        <div className="flex flex-wrap gap-1.5">
          {SESSION_PRESETS.map((n) => (
            <button key={n} onClick={() => submit(n)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors">
              {n.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            type="number" min={1} placeholder="Custom…"
            value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(parseInt(custom, 10)); }}
            className="h-7 text-xs flex-1"
          />
          <button onClick={() => submit(parseInt(custom, 10))}
            className="text-xs px-2 h-7 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Set
          </button>
        </div>
        {sessionGoal && (
          <button onClick={() => { onClearGoal(); setOpen(false); }}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors">
            Clear goal
          </button>
        )}
        {goalReached && (
          <p className="text-xs text-green-500 text-center font-medium">🎉 Goal reached!</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── doc target button ─────────────────────────────────────────────────────────

const DOC_PRESETS = [1000, 2000, 5000, 10000];

function DocTargetButton({ wordCount, wordTarget, docProgress, onSetTarget }: {
  wordCount: number;
  wordTarget: number | null;
  docProgress: number;
  onSetTarget: (n: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function submit(val: number) {
    if (val > 0) { onSetTarget(val); setOpen(false); setCustom(""); }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button className={`flex items-center gap-1.5 h-6 px-1.5 rounded transition-colors ${wordTarget ? "hover:bg-muted" : "hover:text-foreground hover:bg-muted"}`}>
              {wordTarget ? (
                <>
                  <ProgressRing progress={docProgress} reached={docProgress >= 1} size={22} stroke={2.5} />
                  <span className={`tabular-nums ${docProgress >= 1 ? "text-green-500" : ""}`}>
                    {wordCount.toLocaleString()}/{wordTarget.toLocaleString()}
                  </span>
                </>
              ) : (
                <Target className="h-3.5 w-3.5" />
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {wordTarget ? "Document target" : "Set document target"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="top" align="end" className="w-52 p-3 space-y-3">
        <p className="text-xs font-medium">Document target</p>
        <div className="flex flex-wrap gap-1.5">
          {DOC_PRESETS.map((n) => (
            <button key={n} onClick={() => submit(n)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors">
              {n.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input
            type="number" min={1} placeholder="Custom…"
            value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(parseInt(custom, 10)); }}
            className="h-7 text-xs flex-1"
          />
          <button onClick={() => submit(parseInt(custom, 10))}
            className="text-xs px-2 h-7 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Set
          </button>
        </div>
        {wordTarget && (
          <button onClick={() => { onSetTarget(null); setOpen(false); }}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors">
            Clear target
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── wikilink insert button (adapted from tiptap-editor) ──────────────────────

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { DynamicIcon } from "@/components/entity-types/icon-picker";

type EntityTypeFilter = { id: string; name: string; icon: string | null; slug: string };
type AutocompleteResult = { id: string; name: string; slug: string; entityTypeId: string; entityTypeName: string; entityTypeIcon: string | null };

function WritingWikilinkButton({ editor, worldSlug }: { editor: Editor; worldSlug: string }) {
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

  function insertWikilink(item: AutocompleteResult) {
    editor?.chain().focus().insertContent({ type: "wikilink", attrs: { id: item.id, label: item.name, dead: false } }).run();
    setOpen(false);
    setQuery("");
    setSelectedTypeId(null);
    setResults([]);
  }

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) { setQuery(""); setSelectedTypeId(null); setResults([]); return; }
    const res = await fetch(`/api/worlds/${worldSlug}/entity-types`);
    if (res.ok) setEntityTypes(await res.json());
    fetchResults("", null);
  }

  const grouped = results.reduce<Record<string, AutocompleteResult[]>>((acc, r) => {
    (acc[r.entityTypeId] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 rounded-sm px-2 gap-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
        {entityTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 px-0.5">
            <button type="button" onClick={() => { setSelectedTypeId(null); fetchResults(query, null); }}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${selectedTypeId === null ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
              All
            </button>
            {entityTypes.map((t) => (
              <button key={t.id} type="button" onClick={() => { setSelectedTypeId(t.id); fetchResults(query, t.id); }}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${selectedTypeId === t.id ? "bg-primary text-primary-foreground border-primary cursor-pointer" : "border-border text-muted-foreground hover:bg-accent cursor-pointer"}`}>
                {t.icon && <DynamicIcon name={t.icon} size={11} />}
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div className="max-h-52 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground px-2 py-3 text-center">Searching…</p>}
          {!loading && results.length === 0 && <p className="text-xs text-muted-foreground px-2 py-3 text-center">No entities found</p>}
          {!loading && selectedTypeId !== null && results.map((item) => (
            <button key={item.id} type="button" onClick={() => insertWikilink(item)}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors cursor-pointer">
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
                  <button key={item.id} type="button" onClick={() => insertWikilink(item)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors cursor-pointer">
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

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="h-5 mx-0.5" />;
}

function ToolbarButton({ label, onClick, active, disabled, children }: {
  label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
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
