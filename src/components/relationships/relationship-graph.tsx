"use client";

import { useCallback, useEffect, useRef, useState, createContext, useContext, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
  type OnConnect,
  type OnNodesChange,
  type NodeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pencil,
  X,
  Tag,
  RotateCcw,
  Trash2,
  Network,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { EntityPreviewDrawer } from "@/components/entities/entity-preview-drawer";
import { blobDisplayUrl } from "@/lib/utils";
import { createRelationAction, updateRelationAction, deleteRelationAction } from "@/lib/actions/relations";
import { saveGraphSettingsAction } from "@/lib/actions/graph-settings";
import type { Entity, EntityType, EntityRelation } from "@/lib/db/schema";

// ─── constants ────────────────────────────────────────────────────────────────

const NODE_W = 192;
const NODE_H = 58;

const RELATION_SUGGESTIONS = [
  "part of", "contains", "member of", "leads to",
  "ally", "enemy", "opposes", "supports",
  "rules", "serves", "commands", "founded",
  "created by", "owned by", "caused", "related to",
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  // Golden angle spread ensures adjacent hashes land on maximally distinct hues
  const hue = (Math.abs(hash) * 137.508) % 360;
  return `hsl(${hue}, 60%, 52%)`;
}

// ─── types ────────────────────────────────────────────────────────────────────

export type EntityNodeData = {
  label: string;
  entityTypeIcon: string | null;
  entityTypeName: string;
  href: string;
  tags: string[];
  entity: Entity;
  entityType: EntityType;
};

export type GraphNode = Node<EntityNodeData, "entity">;
export type AnyGraphNode = GraphNode;

export type GraphEdge = Edge;
export type GraphRelation = Pick<EntityRelation, "id" | "sourceEntityId" | "targetEntityId" | "label">;

// ─── context (shared with custom nodes) ──────────────────────────────────────

const GraphCtx = createContext<{
  editMode: boolean;
  onEntityClick: (entityId: string) => void;
  onHideEntity: (entityId: string) => void;
  highlightedEntityIds: Set<string> | null;
}>({ editMode: false, onEntityClick: () => {}, onHideEntity: () => {}, highlightedEntityIds: null });

// ─── localStorage helpers ─────────────────────────────────────────────────────

function posKey(worldId: string) {
  return `rel:${worldId}:positions`;
}

function loadPositions(worldId: string): Record<string, { x: number; y: number }> {
  try {
    const v = localStorage.getItem(posKey(worldId));
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

function savePositions(worldId: string, nodes: AnyGraphNode[]) {
  const out: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    if (n.type === "entity") out[n.id] = n.position;
  }
  try {
    localStorage.setItem(posKey(worldId), JSON.stringify(out));
  } catch {
    // storage full — ignore
  }
}

// ─── layout helpers ───────────────────────────────────────────────────────────

function dagreLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  if (nodes.length === 0) return nodes;
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 90, nodesep: 44 });
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) {
    if (nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target)) {
      g.setEdge(e.source, e.target);
    }
  }
  Dagre.layout(g);
  return nodes.map((n) => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } };
  });
}


// ─── edge builders ────────────────────────────────────────────────────────────

function buildWikilinkEdges(wikiEdges: GraphEdge[]): GraphEdge[] {
  return wikiEdges.map((e) => ({
    ...e,
    id: `wl-${e.source}-${e.target}`,
    type: "curved",
    style: { strokeDasharray: "4 4", strokeWidth: 1, opacity: 0.45 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
    data: { kind: "wikilink" },
    selectable: false,
  }));
}

function buildRelationEdges(relations: GraphRelation[]): GraphEdge[] {
  return relations.map((r) => ({
    id: `rel-${r.id}`,
    source: r.sourceEntityId,
    target: r.targetEntityId,
    type: "curved",
    style: { strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
    data: { kind: "relation", relationId: r.id, label: r.label },
  }));
}

// ─── custom curved edge ───────────────────────────────────────────────────────

function CurvedEdge({
  id, source, target,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, markerEnd, data,
}: EdgeProps) {
  const { highlightedEntityIds } = useContext(GraphCtx);
  const label = data?.label as string | undefined;
  const isRelation = data?.kind === "relation";

  let edgeOpacity = 1;
  if (highlightedEntityIds !== null) {
    const srcHit = highlightedEntityIds.has(source);
    const tgtHit = highlightedEntityIds.has(target);
    if (srcHit && tgtHit) edgeOpacity = 1;
    else if (srcHit || tgtHit) edgeOpacity = 0.25;
    else edgeOpacity = 0.06;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <g style={{ opacity: edgeOpacity, transition: "opacity 0.2s" }}>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {isRelation && label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none px-1.5 py-0.5 rounded bg-background/90 backdrop-blur-sm border border-border/40 text-[10px] font-semibold leading-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              opacity: edgeOpacity,
              transition: "opacity 0.2s",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

const edgeTypes = { curved: CurvedEdge };

// ─── custom nodes ─────────────────────────────────────────────────────────────

function EntityNode({ data, isConnectable, id }: NodeProps<GraphNode>) {
  const { editMode, onEntityClick, onHideEntity, highlightedEntityIds } = useContext(GraphCtx);

  const isHighlighted = highlightedEntityIds !== null && highlightedEntityIds.has(id);
  const isDimmed = highlightedEntityIds !== null && !highlightedEntityIds.has(id);
  const accentColor = isHighlighted && data.tags.length > 0 ? tagColor(data.tags[0]) : null;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className={`w-2.5! h-2.5! border-2! border-background! bg-muted-foreground! transition-opacity ${
          editMode ? "opacity-100!" : "opacity-0!"
        }`}
      />
      <div className="group relative">
        <button
          onClick={() => !editMode && onEntityClick(id)}
          className={`bg-background/90 backdrop-blur-sm border rounded-lg text-left shadow-sm transition-all duration-200 overflow-hidden flex ${
            editMode
              ? "cursor-crosshair hover:border-primary/50 border-border/70"
              : "cursor-pointer hover:shadow-md border-border/70 hover:border-foreground/40"
          } ${isDimmed ? "opacity-20" : "opacity-100"}`}
          style={{
            width: NODE_W,
            height: NODE_H,
            ...(accentColor ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}40` } : {}),
          }}
        >
          <div className="flex flex-col justify-center flex-1 min-w-0 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <DynamicIcon name={data.entityTypeIcon ?? ""} size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate flex-1">{data.entityTypeName}</span>
              {data.tags.length > 0 && (
                <div className="flex gap-0.5 shrink-0">
                  {data.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: tagColor(t) }}
                      title={t}
                    />
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm font-medium truncate">{data.label}</span>
          </div>
          {data.entity.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobDisplayUrl(data.entity.imageUrl)}
              alt=""
              className="h-full w-10 object-cover shrink-0"
              style={data.entity.imagePosition ? { objectPosition: data.entity.imagePosition } : undefined}
            />
          )}
        </button>
        {!editMode && (
          <button
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded flex items-center justify-center bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onHideEntity(id); }}
            title="Hide entity"
          >
            <EyeOff size={9} />
          </button>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className={`w-2.5! h-2.5! border-2! border-background! bg-muted-foreground! transition-opacity ${
          editMode ? "opacity-100!" : "opacity-0!"
        }`}
      />
    </>
  );
}

const nodeTypes = { entity: EntityNode };

// ─── relation popup ───────────────────────────────────────────────────────────

interface RelationPopupProps {
  mode: "create" | "edit";
  initialLabel: string;
  position: { x: number; y: number };
  containerSize: { w: number; h: number };
  pending: boolean;
  onSave: (label: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const POPUP_W = 240;
const POPUP_H = 220;

function RelationPopup({
  mode, initialLabel, position, containerSize, pending, onSave, onDelete, onClose,
}: RelationPopupProps) {
  const [label, setLabel] = useState(initialLabel);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setLabel(initialLabel); }, [initialLabel]);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose();
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [onClose]);

  // Clamp to container
  const rawX = position.x - POPUP_W / 2;
  const rawY = position.y - POPUP_H - 12;
  const x = Math.max(8, Math.min(rawX, containerSize.w - POPUP_W - 8));
  const y = rawY < 8 ? position.y + 12 : Math.min(rawY, containerSize.h - POPUP_H - 8);

  return (
    <div
      ref={ref}
      className="absolute z-50 flex flex-col bg-background/90 backdrop-blur-md border border-border/60 rounded-xl shadow-xl overflow-hidden"
      style={{ left: x, top: y, width: POPUP_W }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/50">
        <span className="text-xs font-semibold">
          {mode === "create" ? "New relationship" : "Edit relationship"}
        </span>
        <button
          onClick={onClose}
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Label input */}
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Label</span>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. part of, rules, created by…"
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && label.trim()) onSave(label);
              if (e.key === "Escape") onClose();
            }}
          />
        </div>

        {/* Quick-pick suggestions */}
        <div className="flex flex-wrap gap-1">
          {RELATION_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setLabel(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${
                label === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          {mode === "edit" && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
              onClick={onDelete}
              disabled={pending}
            >
              <Trash2 size={12} className="mr-1" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={() => onSave(label)} disabled={pending || !label.trim()}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── inner graph (needs ReactFlowProvider context) ────────────────────────────

type GraphSettingsInit = {
  nodePositions: Record<string, { x: number; y: number }>;
  hiddenEntityIds: string[];
  hiddenTypeIds: string[];
} | null;

interface InnerGraphProps {
  worldId: string;
  worldSlug: string;
  worldName: string;
  rawNodes: GraphNode[];
  wikiEdges: GraphEdge[];
  relations: GraphRelation[];
  allTags: string[];
  initialSettings: GraphSettingsInit;
  readOnly?: boolean;
}

function InnerGraph({ worldId, worldSlug, worldName, rawNodes, wikiEdges, relations, allTags, initialSettings, readOnly = false }: InnerGraphProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── mode state ──────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const tagFilterRef = useRef<HTMLDivElement>(null);

  // ── visibility state ─────────────────────────────────────────────────────────
  const [hiddenEntityIds, setHiddenEntityIds] = useState<Set<string>>(() => {
    if (initialSettings?.hiddenEntityIds?.length) return new Set(initialSettings.hiddenEntityIds);
    try {
      const v = localStorage.getItem(`rel:${worldId}:hiddenEntities`);
      return new Set<string>(v ? JSON.parse(v) : []);
    } catch { return new Set<string>(); }
  });
  const [hiddenTypeIds, setHiddenTypeIds] = useState<Set<string>>(() => {
    if (initialSettings?.hiddenTypeIds?.length) return new Set(initialSettings.hiddenTypeIds);
    try {
      const v = localStorage.getItem(`rel:${worldId}:hiddenTypes`);
      return new Set<string>(v ? JSON.parse(v) : []);
    } catch { return new Set<string>(); }
  });
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const visibilityRef = useRef<HTMLDivElement>(null);

  const entityTypesList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string | null }>();
    for (const n of rawNodes) {
      if (!map.has(n.data.entityType.id))
        map.set(n.data.entityType.id, { id: n.data.entityType.id, name: n.data.entityTypeName, icon: n.data.entityTypeIcon });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rawNodes]);

  const visibleRawNodes = useMemo(() =>
    rawNodes.filter((n) => !hiddenEntityIds.has(n.id) && !hiddenTypeIds.has(n.data.entityType.id)),
    [rawNodes, hiddenEntityIds, hiddenTypeIds]
  );

  const hiddenEntitiesList = useMemo(() =>
    rawNodes
      .filter((n) => hiddenEntityIds.has(n.id))
      .sort((a, b) => a.data.label.localeCompare(b.data.label)),
    [rawNodes, hiddenEntityIds]
  );

  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Refs so event handlers can read current state without stale closures
  // (setState updaters must be pure — no side effects like server actions inside them)
  const hiddenEntityIdsRef = useRef(hiddenEntityIds);
  hiddenEntityIdsRef.current = hiddenEntityIds;
  const hiddenTypeIdsRef = useRef(hiddenTypeIds);
  hiddenTypeIdsRef.current = hiddenTypeIds;

  const handleHideEntity = useCallback((entityId: string) => {
    const next = new Set(hiddenEntityIdsRef.current);
    next.add(entityId);
    const ids = [...next];
    setHiddenEntityIds(next);
    try { localStorage.setItem(`rel:${worldId}:hiddenEntities`, JSON.stringify(ids)); } catch { /* ignore */ }
    saveGraphSettingsAction(worldId, { hiddenEntityIds: ids });
  }, [worldId]);

  const handleShowEntity = useCallback((entityId: string) => {
    const next = new Set(hiddenEntityIdsRef.current);
    next.delete(entityId);
    const ids = [...next];
    setHiddenEntityIds(next);
    try { localStorage.setItem(`rel:${worldId}:hiddenEntities`, JSON.stringify(ids)); } catch { /* ignore */ }
    saveGraphSettingsAction(worldId, { hiddenEntityIds: ids });
  }, [worldId]);

  const handleToggleType = useCallback((typeId: string) => {
    const next = new Set(hiddenTypeIdsRef.current);
    if (next.has(typeId)) next.delete(typeId); else next.add(typeId);
    const ids = [...next];
    setHiddenTypeIds(next);
    try { localStorage.setItem(`rel:${worldId}:hiddenTypes`, JSON.stringify(ids)); } catch { /* ignore */ }
    saveGraphSettingsAction(worldId, { hiddenTypeIds: ids });
  }, [worldId]);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as HTMLElement))
        setVisibilityOpen(false);
    }
    if (visibilityOpen) document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [visibilityOpen]);

  // ── drawer state ─────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEntity, setDrawerEntity] = useState<Entity | null>(null);
  const [drawerEntityType, setDrawerEntityType] = useState<EntityType | null>(null);

  const handleEntityClick = useCallback((entityId: string) => {
    const node = rawNodes.find((n) => n.id === entityId);
    if (!node) return;
    setDrawerEntity(node.data.entity);
    setDrawerEntityType(node.data.entityType);
    setDrawerOpen(true);
  }, [rawNodes]);

  // ── tag filter highlight ─────────────────────────────────────────────────────
  const highlightedEntityIds = useMemo<Set<string> | null>(() => {
    if (selectedTags.size === 0) return null;
    return new Set(
      rawNodes
        .filter((n) => [...selectedTags].every((t) => n.data.tags.includes(t)))
        .map((n) => n.id)
    );
  }, [selectedTags, rawNodes]);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(e.target as HTMLElement)) {
        setTagFilterOpen(false);
      }
    }
    if (tagFilterOpen) document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [tagFilterOpen]);

  // ── popup state ─────────────────────────────────────────────────────────────
  const [popup, setPopup] = useState<{
    mode: "create" | "edit";
    connection?: Connection;
    edgeId?: string;
    relationId?: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [popupPending, setPopupPending] = useState(false);

  // ── compute combined edges ───────────────────────────────────────────────────
  const allEdges = useMemo(
    () => [...buildWikilinkEdges(wikiEdges), ...buildRelationEdges(relations)],
    [wikiEdges, relations]
  );

  // ── initial node layout — DB positions take priority, then localStorage, then dagre ─
  const initialNodes = useMemo<AnyGraphNode[]>(() => {
    const dbPositions = initialSettings?.nodePositions ?? {};
    const lsPositions = loadPositions(worldId);
    const positions = Object.keys(dbPositions).length > 0 ? dbPositions : lsPositions;
    if (Object.keys(positions).length > 0) {
      return visibleRawNodes.map((n) => ({ ...n, position: positions[n.id] ?? n.position }));
    }
    return dagreLayout(visibleRawNodes, allEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<AnyGraphNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);

  // Keep edges in sync when relations prop changes
  useEffect(() => {
    setEdges([...buildWikilinkEdges(wikiEdges), ...buildRelationEdges(relations)]);
  }, [relations, wikiEdges, setEdges]);

  // Re-layout when visibility changes (preserve saved positions where available)
  const visibilityMounted = useRef(false);
  useEffect(() => {
    if (!visibilityMounted.current) { visibilityMounted.current = true; return; }
    const saved = loadPositions(worldId);
    setNodes(
      Object.keys(saved).length > 0
        ? visibleRawNodes.map((n) => ({ ...n, position: saved[n.id] ?? { x: 0, y: 0 } }))
        : dagreLayout(visibleRawNodes, allEdges)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRawNodes]);

  // ── drag stop → save positions ───────────────────────────────────────────────
  const handleNodesChange: OnNodesChange<AnyGraphNode> = useCallback(
    (changes: NodeChange<AnyGraphNode>[]) => {
      onNodesChange(changes);
      const hasPositionChange = changes.some((c) => c.type === "position" && c.dragging === false);
      if (hasPositionChange) {
        setNodes((prev) => {
          savePositions(worldId, prev); // localStorage — immediate
          // DB — debounced so rapid drags don't fire many requests
          const positions: Record<string, { x: number; y: number }> = {};
          for (const n of prev) {
            if (n.type === "entity") positions[n.id] = n.position;
          }
          clearTimeout(positionSaveTimer.current);
          positionSaveTimer.current = setTimeout(() => {
            saveGraphSettingsAction(worldId, { nodePositions: positions });
          }, 1500);
          return prev;
        });
      }
    },
    [onNodesChange, worldId, setNodes]
  );

  // ── reset layout ─────────────────────────────────────────────────────────────
  function handleReset() {
    try { localStorage.removeItem(posKey(worldId)); } catch { /* ignore */ }
    saveGraphSettingsAction(worldId, { nodePositions: {} });
    setNodes(dagreLayout(visibleRawNodes, allEdges));
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
  }

  // ── edge creation ────────────────────────────────────────────────────────────
  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;
      const rect = containerRef.current?.getBoundingClientRect();
      setPopup({
        mode: "create",
        connection,
        label: "",
        x: rect ? rect.width / 2 : 400,
        y: rect ? rect.height / 2 : 300,
      });
    },
    []
  );

  // ── edge click (edit existing relation) ──────────────────────────────────────
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (edge.data?.kind !== "relation") return;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect ? event.clientY - rect.top : event.clientY;
    setPopup({
      mode: "edit",
      edgeId: edge.id,
      relationId: edge.data.relationId as string,
      label: (edge.data.label as string) ?? "",
      x,
      y,
    });
  }, []);

  // ── popup save ───────────────────────────────────────────────────────────────
  async function handlePopupSave(label: string) {
    if (!popup || !label.trim()) return;
    setPopupPending(true);

    if (popup.mode === "create" && popup.connection) {
      const { source, target } = popup.connection;
      const result = await createRelationAction(worldId, source!, target!, label);
      if (result.success && result.id) {
        const newEdge = buildRelationEdges([{
          id: result.id,
          sourceEntityId: source!,
          targetEntityId: target!,
          label,
        }])[0];
        setEdges((prev) => [...prev, newEdge]);
      }
    } else if (popup.mode === "edit" && popup.relationId) {
      const result = await updateRelationAction(popup.relationId, worldId, label);
      if (result.success) {
        setEdges((prev) =>
          prev.map((e) =>
            e.id === popup.edgeId
              ? {
                  ...e,
                  label,
                  data: { ...e.data, label },
                }
              : e
          )
        );
      }
    }

    setPopupPending(false);
    setPopup(null);
  }

  async function handlePopupDelete() {
    if (!popup?.relationId || !popup.edgeId) return;
    setPopupPending(true);
    const result = await deleteRelationAction(popup.relationId, worldId);
    if (result.success) {
      setEdges((prev) => prev.filter((e) => e.id !== popup.edgeId));
    }
    setPopupPending(false);
    setPopup(null);
  }

  const containerSize = {
    w: containerRef.current?.offsetWidth ?? 800,
    h: containerRef.current?.offsetHeight ?? 600,
  };

  if (rawNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-background">
        <Network size={40} strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No relationships yet</p>
          <p className="text-sm mt-1">
            Link entities using{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-xs font-mono">[[</kbd>{" "}
            in the editor, or switch to{" "}
            <strong>Edit</strong> mode and draw connections here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GraphCtx.Provider value={{ editMode, onEntityClick: handleEntityClick, onHideEntity: handleHideEntity, highlightedEntityIds }}>
      <div ref={containerRef} className="relative w-full h-full bg-background">
        {/* Frosted glass breadcrumb — top left, matching map view */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-lg border border-border/50 shadow-sm px-3 py-1.5 text-sm leading-none">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Your Worlds
          </Link>
          <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
          <Link href={`/worlds/${worldSlug}`} className="text-muted-foreground hover:text-foreground transition-colors">
            {worldName}
          </Link>
          <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
          <span className="font-medium">Relationships</span>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          nodesDraggable
          nodesConnectable={editMode}
          elementsSelectable={editMode}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className={editMode ? "cursor-crosshair" : ""}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
        </ReactFlow>

        {/* Edit mode hint pill */}
        {editMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow pointer-events-none select-none">
            Drag from a handle to create a relationship · click an edge to edit it
          </div>
        )}

        {/* Relation popup */}
        {popup && (
          <RelationPopup
            mode={popup.mode}
            initialLabel={popup.label}
            position={{ x: popup.x, y: popup.y }}
            containerSize={containerSize}
            pending={popupPending}
            onSave={handlePopupSave}
            onDelete={popup.mode === "edit" ? handlePopupDelete : undefined}
            onClose={() => setPopup(null)}
          />
        )}

        {/* Bottom frosted glass toolbar */}
        <TooltipProvider delayDuration={300}>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg px-2 py-1.5">
            {/* Zoom controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomIn()}>
                  <ZoomIn size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Zoom in</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomOut()}>
                  <ZoomOut size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Zoom out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => fitView({ padding: 0.2, duration: 400 })}>
                  <Maximize2 size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Fit view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleReset}>
                  <RotateCcw size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Reset layout</TooltipContent>
            </Tooltip>

            {!readOnly && (
              <>
                <div className="w-px h-5 bg-border mx-0.5" />
                {/* Edit relations */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode ? "default" : "ghost"}
                      className="gap-1.5 h-8 px-3"
                      onClick={() => setEditMode((v) => !v)}
                    >
                      {editMode ? <><X size={13} />Done</> : <><Pencil size={13} />Edit</>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {editMode ? "Exit edit mode" : "Draw relationships"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Visibility panel */}
            <div className="relative" ref={visibilityRef}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={(hiddenEntityIds.size > 0 || hiddenTypeIds.size > 0) ? "default" : "ghost"}
                    className="gap-1.5 h-8 px-3"
                    onClick={() => setVisibilityOpen((v) => !v)}
                  >
                    <Eye size={13} />
                    {(hiddenEntityIds.size + hiddenTypeIds.size) > 0
                      ? `Visibility (${hiddenEntityIds.size + hiddenTypeIds.size})`
                      : "Visibility"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Show / hide entity types and entities</TooltipContent>
              </Tooltip>

              {visibilityOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 w-60">
                  {/* Entity types */}
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Entity types</p>
                  <div className="flex flex-col gap-0.5 mb-3">
                    {entityTypesList.map((type) => {
                      const hidden = hiddenTypeIds.has(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleToggleType(type.id)}
                          className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md transition-colors w-full text-left ${
                            hidden ? "text-muted-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <DynamicIcon name={type.icon ?? ""} size={12} className="shrink-0 text-muted-foreground" />
                          <span className={`flex-1 ${hidden ? "line-through opacity-50" : ""}`}>{type.name}</span>
                          {hidden ? <EyeOff size={11} className="text-muted-foreground/50" /> : <Eye size={11} className="text-muted-foreground/30" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Individually hidden entities */}
                  {hiddenEntitiesList.length > 0 && (
                    <div className="border-t border-border/50 pt-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                          Hidden entities
                        </p>
                        <button
                          onClick={() => {
                            setHiddenEntityIds(new Set());
                            try { localStorage.removeItem(`rel:${worldId}:hiddenEntities`); } catch { /* ignore */ }
                            saveGraphSettingsAction(worldId, { hiddenEntityIds: [] });
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Show all
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {hiddenEntitiesList.map((n) => (
                          <div key={n.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-muted/30">
                            <DynamicIcon name={n.data.entityTypeIcon ?? ""} size={11} className="shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground truncate flex-1">{n.data.label}</span>
                            <button
                              onClick={() => handleShowEntity(n.id)}
                              className="text-[10px] text-primary hover:text-primary/70 transition-colors shrink-0 font-medium"
                            >
                              Show
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {allTags.length > 0 && (
              <>
                <div className="w-px h-5 bg-border mx-0.5" />

                {/* Tag filter */}
                <div className="relative" ref={tagFilterRef}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={selectedTags.size > 0 ? "default" : "ghost"}
                        className="gap-1.5 h-8 px-3"
                        onClick={() => setTagFilterOpen((v) => !v)}
                      >
                        <Tag size={13} />
                        {selectedTags.size > 0 ? `Tags (${selectedTags.size})` : "Filter"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Filter entities by tag</TooltipContent>
                  </Tooltip>

                  {tagFilterOpen && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-3 min-w-52">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                          Filter by tag
                        </p>
                        {selectedTags.size > 0 && (
                          <button
                            onClick={() => setSelectedTags(new Set())}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag) => {
                          const active = selectedTags.has(tag);
                          const color = tagColor(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                setSelectedTags((prev) => {
                                  const next = new Set(prev);
                                  if (active) next.delete(tag);
                                  else next.add(tag);
                                  return next;
                                });
                              }}
                              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-all"
                              style={
                                active
                                  ? { backgroundColor: color, borderColor: color, color: "white" }
                                  : { borderColor: `${color}50`, color: "inherit" }
                              }
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: active ? "white" : color }}
                              />
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      {selectedTags.size > 1 && (
                        <p className="text-[10px] text-muted-foreground mt-2.5 pt-2 border-t border-border/50">
                          Showing entities with all {selectedTags.size} selected tags
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Entity preview drawer */}
      {drawerEntity && drawerEntityType && (
        <EntityPreviewDrawer
          entity={drawerEntity}
          entityType={drawerEntityType}
          worldSlug={worldSlug}
          open={drawerOpen}
          readOnly={readOnly}
          onClose={() => {
            setDrawerOpen(false);
            setDrawerEntity(null);
            setDrawerEntityType(null);
          }}
        />
      )}
    </GraphCtx.Provider>
  );
}

// ─── exported component (wraps with provider) ─────────────────────────────────

export interface RelationshipGraphProps {
  worldId: string;
  worldSlug: string;
  worldName: string;
  nodes: GraphNode[];
  wikiEdges: GraphEdge[];
  relations: GraphRelation[];
  allTags: string[];
  initialSettings: GraphSettingsInit;
  readOnly?: boolean;
}

export function RelationshipGraph({ nodes, worldSlug, worldName, ...rest }: RelationshipGraphProps) {
  return (
    <ReactFlowProvider>
      <InnerGraph rawNodes={nodes} worldSlug={worldSlug} worldName={worldName} {...rest} />
    </ReactFlowProvider>
  );
}
