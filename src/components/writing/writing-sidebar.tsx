"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, FolderPlus, MoreHorizontal, Trash2, FilePlus, FolderOpen, FileText, ChevronRight, ChevronDown } from "lucide-react";
import {
  createWritingDocumentAction,
  createWritingProjectAction,
  deleteWritingDocumentAction,
  deleteWritingProjectAction,
  assignDocumentToProjectAction,
} from "@/lib/actions/writing";
import type { WritingProject, WritingDocument } from "@/lib/db/queries/writing";

interface WritingSidebarProps {
  worldId: string;
  worldSlug: string;
  projects: WritingProject[];
  documents: WritingDocument[];
}

export function WritingSidebar({ worldId, worldSlug, projects, documents }: WritingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newProjectName, setNewProjectName] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [draggingDocId, setDraggingDocId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null); // projectId or "ungrouped"

  useEffect(() => {
    if (addingProject) newProjectInputRef.current?.focus();
  }, [addingProject]);

  const currentDocSlug = pathname.split("/writing/")[1] ?? "";

  const ungrouped = documents.filter((d) => !d.projectId);
  const byProject = new Map<string, WritingDocument[]>();
  for (const p of projects) byProject.set(p.id, []);
  for (const d of documents) {
    if (d.projectId && byProject.has(d.projectId)) {
      byProject.get(d.projectId)!.push(d);
    }
  }

  function handleCreateDoc(projectId?: string | null) {
    startTransition(async () => {
      await createWritingDocumentAction(worldId, worldSlug, projectId);
    });
  }

  function handleCreateProject() {
    const name = newProjectName.trim();
    if (!name) { setAddingProject(false); return; }
    startTransition(async () => {
      await createWritingProjectAction(worldId, worldSlug, name);
      setNewProjectName("");
      setAddingProject(false);
      router.refresh();
    });
  }

  function handleDeleteDoc(docId: string, docSlug: string) {
    startTransition(async () => {
      await deleteWritingDocumentAction(docId, worldId, worldSlug, currentDocSlug, docSlug);
      router.refresh();
    });
  }

  function handleDeleteProject(projectId: string) {
    startTransition(async () => {
      await deleteWritingProjectAction(projectId, worldId, worldSlug);
      router.refresh();
    });
  }

  function toggleProject(projectId: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  // ── drag handlers ────────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, docId: string) {
    e.dataTransfer.setData("text/plain", docId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingDocId(docId);
  }

  function handleDragEnd() {
    setDraggingDocId(null);
    setDragOverTarget(null);
  }

  function handleDragOver(e: React.DragEvent, target: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(target);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the drop zone entirely (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverTarget(null);
  }

  function handleDrop(e: React.DragEvent, targetProjectId: string | null) {
    e.preventDefault();
    const docId = e.dataTransfer.getData("text/plain");
    if (!docId) return;
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    setDraggingDocId(null);
    setDragOverTarget(null);
    if (doc.projectId === targetProjectId) return;
    startTransition(async () => {
      await assignDocumentToProjectAction(docId, worldId, worldSlug, targetProjectId);
      router.refresh();
    });
  }

  const isDragging = draggingDocId !== null;

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-background/40 backdrop-blur-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Writing</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleCreateDoc()}
            disabled={isPending}
            title="New document"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setAddingProject(true)}
            disabled={isPending}
            title="New project"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {/* Ungrouped drop zone */}
        <div
          onDragOver={(e) => handleDragOver(e, "ungrouped")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`mx-2 rounded-md transition-colors ${
            isDragging && dragOverTarget === "ungrouped"
              ? "bg-primary/10 ring-1 ring-primary/30 min-h-[28px] mb-1"
              : isDragging && ungrouped.length === 0
              ? "border border-dashed border-border/50 min-h-[28px] mb-1"
              : ""
          }`}
        >
          {isDragging && dragOverTarget === "ungrouped" && ungrouped.length === 0 && (
            <p className="text-[10px] text-primary/60 text-center py-1.5">Drop here to ungroup</p>
          )}
          {ungrouped.map((doc) => (
            <DocItem
              key={doc.id}
              doc={doc}
              worldSlug={worldSlug}
              isActive={currentDocSlug === doc.slug}
              onDelete={() => handleDeleteDoc(doc.id, doc.slug)}
              onDragStart={(e) => handleDragStart(e, doc.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggingDocId === doc.id}
            />
          ))}
        </div>

        {/* Drop-to-ungroup hint when dragging an assigned doc */}
        {isDragging && dragOverTarget !== "ungrouped" && ungrouped.length > 0 &&
          documents.find((d) => d.id === draggingDocId)?.projectId && (
          <div
            onDragOver={(e) => handleDragOver(e, "ungrouped")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className="mx-2 mb-1 min-h-[24px] rounded-md border border-dashed border-primary/30 flex items-center justify-center"
          >
            <p className="text-[10px] text-muted-foreground/60">Drop here to ungroup</p>
          </div>
        )}

        {/* Projects */}
        {projects.map((project) => {
          const projectDocs = byProject.get(project.id) ?? [];
          const collapsed = collapsedProjects.has(project.id);
          const isDropTarget = isDragging && dragOverTarget === project.id;
          return (
            <div key={project.id}>
              <ProjectItem
                project={project}
                collapsed={collapsed}
                isDropTarget={isDropTarget}
                onToggle={() => toggleProject(project.id)}
                onAddDoc={() => handleCreateDoc(project.id)}
                onDelete={() => handleDeleteProject(project.id)}
                onDragOver={(e) => handleDragOver(e, project.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, project.id)}
              />
              {!collapsed && (
                <div
                  onDragOver={(e) => handleDragOver(e, project.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, project.id)}
                  className={`ml-6 mr-2 rounded-md transition-colors ${
                    isDropTarget ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                >
                  {projectDocs.map((doc) => (
                    <DocItem
                      key={doc.id}
                      doc={doc}
                      worldSlug={worldSlug}
                      isActive={currentDocSlug === doc.slug}
                      onDelete={() => handleDeleteDoc(doc.id, doc.slug)}
                      onDragStart={(e) => handleDragStart(e, doc.id)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggingDocId === doc.id}
                      indent
                    />
                  ))}
                  {projectDocs.length === 0 && !isDropTarget && (
                    <button
                      onClick={() => handleCreateDoc(project.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors italic"
                    >
                      No documents yet
                    </button>
                  )}
                  {projectDocs.length === 0 && isDropTarget && (
                    <p className="text-[10px] text-primary/60 text-center py-1.5">Drop to add</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New project input */}
        {addingProject && (
          <div className="px-2 py-1">
            <input
              ref={newProjectInputRef}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") { setAddingProject(false); setNewProjectName(""); }
              }}
              onBlur={handleCreateProject}
              placeholder="Project name…"
              className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        {/* Empty state */}
        {documents.length === 0 && projects.length === 0 && !addingProject && (
          <div className="px-3 py-6 text-center">
            <FileText size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No documents yet</p>
            <button
              onClick={() => handleCreateDoc()}
              className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Create one
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function DocItem({
  doc,
  worldSlug,
  isActive,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  indent = false,
}: {
  doc: WritingDocument;
  worldSlug: string;
  isActive: boolean;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  indent?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const hasTarget = doc.wordTarget != null && doc.wordTarget > 0;
  const targetProgress = hasTarget ? Math.min(1, doc.wordCount / doc.wordTarget!) : 0;
  const targetReached = hasTarget && targetProgress >= 1;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center pr-1 select-none transition-opacity cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <div
        onClick={() => router.push(`/worlds/${worldSlug}/writing/${doc.slug}`)}
        className={`flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
          isActive
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        <FileText size={12} className="shrink-0 text-muted-foreground/60" />
        <span className="truncate">{doc.title}</span>
        {hasTarget && (
          <span className="ml-auto shrink-0">
            <SidebarProgressRing progress={targetProgress} reached={targetReached} />
          </span>
        )}
      </div>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
        >
          <MoreHorizontal size={12} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-28">
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarProgressRing({ progress, reached }: { progress: number; reached: boolean }) {
  if (reached) {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16" className="shrink-0">
        <polyline points="3,8.5 6.5,12 13,4" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-green-500" />
      </svg>
    );
  }
  const size = 16;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - Math.min(progress, 1) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted-foreground/20" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="stroke-primary transition-all duration-500"
      />
    </svg>
  );
}

function ProjectItem({
  project,
  collapsed,
  isDropTarget,
  onToggle,
  onAddDoc,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  project: WritingProject;
  collapsed: boolean;
  isDropTarget: boolean;
  onToggle: () => void;
  onAddDoc: () => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group flex items-center px-2 gap-0.5 mt-1 rounded-md mx-1 transition-colors ${
        isDropTarget ? "bg-primary/10 ring-1 ring-primary/30" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 flex-1 min-w-0 px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        {collapsed ? <ChevronRight size={11} className="shrink-0" /> : <ChevronDown size={11} className="shrink-0" />}
        <FolderOpen size={12} className="shrink-0" />
        <span className="truncate font-medium">{project.name}</span>
      </button>
      <button
        onClick={onAddDoc}
        title="Add document"
        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
      >
        <FilePlus size={11} />
      </button>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
        >
          <MoreHorizontal size={12} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-36">
            <button
              onClick={() => { setMenuOpen(false); onAddDoc(); }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
            >
              <FilePlus size={11} />
              Add document
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={11} />
              Delete project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
