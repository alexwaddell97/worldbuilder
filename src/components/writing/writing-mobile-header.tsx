"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { BookOpen, Plus, FileText, FolderOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { createWritingDocumentAction } from "@/lib/actions/writing";
import type { WritingProject, WritingDocument } from "@/lib/db/queries/writing";

interface WritingMobileHeaderProps {
  worldId: string;
  worldSlug: string;
  projects: WritingProject[];
  documents: WritingDocument[];
}

export function WritingMobileHeader({ worldId, worldSlug, projects, documents }: WritingMobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentDocSlug = pathname.split("/writing/")[1] ?? "";

  const ungrouped = documents.filter((d) => !d.projectId);
  const byProject = new Map<string, WritingDocument[]>();
  for (const p of projects) byProject.set(p.id, []);
  for (const d of documents) {
    if (d.projectId && byProject.has(d.projectId)) {
      byProject.get(d.projectId)!.push(d);
    }
  }

  function handleCreateDoc() {
    startTransition(async () => {
      await createWritingDocumentAction(worldId, worldSlug, null);
      router.refresh();
    });
  }

  return (
    <div className="flex md:hidden items-center h-10 px-3 gap-2 border-b border-border bg-background/60 backdrop-blur-sm shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <BookOpen size={13} />
            Documents
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="p-0 w-72 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <span className="text-sm font-semibold text-foreground">Writing</span>
            <SheetClose asChild>
              <button
                onClick={handleCreateDoc}
                disabled={isPending}
                className="h-7 px-2.5 flex items-center gap-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Plus size={12} />
                New doc
              </button>
            </SheetClose>
          </div>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {ungrouped.map((doc) => (
              <SheetClose asChild key={doc.id}>
                <Link
                  href={`/worlds/${worldSlug}/writing/${doc.slug}`}
                  className={`flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors ${
                    currentDocSlug === doc.slug
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <FileText size={13} className="shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{doc.title}</span>
                </Link>
              </SheetClose>
            ))}

            {projects.map((project) => {
              const projectDocs = byProject.get(project.id) ?? [];
              return (
                <div key={project.id} className="mt-1">
                  <div className="flex items-center gap-1.5 px-3 h-8 text-xs text-muted-foreground font-medium">
                    <FolderOpen size={12} className="shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {projectDocs.map((doc) => (
                    <SheetClose asChild key={doc.id}>
                      <Link
                        href={`/worlds/${worldSlug}/writing/${doc.slug}`}
                        className={`flex items-center gap-2.5 pl-7 pr-3 h-9 rounded-md text-sm transition-colors ${
                          currentDocSlug === doc.slug
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <FileText size={13} className="shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    </SheetClose>
                  ))}
                  {projectDocs.length === 0 && (
                    <p className="pl-7 pr-3 py-1 text-xs text-muted-foreground/50 italic">No documents</p>
                  )}
                </div>
              );
            })}

            {documents.length === 0 && projects.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">No documents yet</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
