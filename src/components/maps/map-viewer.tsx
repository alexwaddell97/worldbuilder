"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pencil,
  X,
  ChevronRight,
  Map as MapIconLucide,
  MoreHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from "@/components/entity-types/icon-picker";
import { EntityPreviewDrawer } from "@/components/entities/entity-preview-drawer";
import { MapPinFloatingPanel } from "@/components/maps/map-pin-floating-panel";
import { EditMapDialog } from "@/components/maps/edit-map-dialog";
import { DeleteMapDialog } from "@/components/maps/delete-map-dialog";
import { CreateMapDialog } from "@/components/maps/create-map-dialog";
import { deleteMapPinAction } from "@/lib/actions/maps";
import { blobDisplayUrl, cn } from "@/lib/utils";
import type { MapWithPins, MapPinWithRefs } from "@/lib/db/queries/maps";
import type { Entity, EntityType, Map } from "@/lib/db/schema";
import Link from "next/link";

interface MapViewerProps {
  map: MapWithPins;
  worldId: string;
  worldSlug: string;
  allEntities: (Entity & { entityType: EntityType })[];
  allMaps: Map[];
  /** Ancestor maps navigated through to reach this one */
  trail?: { slug: string; name: string }[];
  /** Disables all editing controls */
  readOnly?: boolean;
  /** Base path for map navigation links, defaults to /worlds/${worldSlug}/maps */
  mapsBasePath?: string;
}

export function MapViewer({
  map,
  worldId,
  worldSlug,
  allEntities,
  allMaps,
  trail = [],
  readOnly = false,
  mapsBasePath,
}: MapViewerProps) {
  const effectiveMapsBase = mapsBasePath ?? `/worlds/${worldSlug}/maps`;
  const router = useRouter();
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [panelScreenPos, setPanelScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MapPinWithRefs | null>(null);
  const [drawerEntity, setDrawerEntity] = useState<Entity | null>(null);
  const [drawerEntityType, setDrawerEntityType] = useState<EntityType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [deleteMapOpen, setDeleteMapOpen] = useState(false);
  const [createMapOpen, setCreateMapOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // Distinguish click from drag so we don't fire pin-place after panning
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  function handleImagePointerDown(e: React.PointerEvent) {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
  }

  function handleImagePointerMove(e: React.PointerEvent) {
    if (!pointerDownRef.current) return;
    const dx = Math.abs(e.clientX - pointerDownRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownRef.current.y);
    if (dx > 5 || dy > 5) didDragRef.current = true;
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editMode || didDragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPos({ x, y });
    setEditingPin(null);
    // Screen pos relative to the outer container for the floating panel
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPanelScreenPos({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
    }
    setPanelOpen(true);
  }

  function handlePinClick(e: React.MouseEvent, pin: MapPinWithRefs) {
    e.stopPropagation();
    if (editMode) {
      setEditingPin(pin);
      setPendingPos(null);
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setPanelScreenPos({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
      }
      setPanelOpen(true);
      return;
    }
    if (pin.entity) {
      setDrawerEntity(pin.entity);
      setDrawerEntityType(pin.entity.entityType);
      setDrawerOpen(true);
    } else if (pin.linkedMap) {
      const newTrail = [...trail.map((t) => t.slug), map.slug].join(",");
      router.push(`${effectiveMapsBase}/${pin.linkedMap.slug}?trail=${newTrail}`);
    }
  }

  async function handleDeletePin(e: React.MouseEvent, pin: MapPinWithRefs) {
    e.stopPropagation();
    await deleteMapPinAction(pin.id);
    router.refresh();
  }

  const isSvg = map.imageUrl?.toLowerCase().includes(".svg");

  const pinLabel = (pin: MapPinWithRefs): string => {
    if (pin.label) return pin.label;
    if (pin.entity) return pin.entity.name;
    if (pin.linkedMap) return pin.linkedMap.name;
    return "Pin";
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-muted/40">

      {/* ── Pan / zoom canvas ─────────────────────────────────────────── */}
      {map.imageUrl ? (
        <TransformWrapper
          ref={transformRef}
          minScale={0.15}
          maxScale={10}
          smooth
          centerOnInit
          limitToBounds={false}
          panning={{ excluded: ["map-pin-btn"] }}
          onTransform={({ state }) => setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
          >
            <div
              className={cn("relative select-none", editMode && "cursor-crosshair")}
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onClick={handleImageClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobDisplayUrl(map.imageUrl)}
                alt={map.name}
                // SVGs without explicit px dimensions default to 300×150 in <img>.
                // min-w-[800px] ensures a usable initial render size while still
                // letting the user zoom in on the full vector detail.
                className={cn("block", isSvg && "min-w-200 min-h-150")}
                draggable={false}
              />
              {map.pins.map((pin) => (
                <MapPinMarker
                  key={pin.id}
                  pin={pin}
                  scale={scale}
                  editMode={editMode}
                  hovered={hoveredPin === pin.id}
                  label={pinLabel(pin)}
                  onMouseEnter={() => setHoveredPin(pin.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={(e) => handlePinClick(e, pin)}
                  onDelete={(e) => handleDeletePin(e, pin)}
                />
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <MapIconLucide size={40} strokeWidth={1} />
          <p className="text-sm font-medium">No map image uploaded yet</p>
          <p className="text-xs">
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
              onClick={() => setEditMapOpen(true)}
            >
              Add an image
            </button>{" "}
            to get started.
          </p>
        </div>
      )}

      {/* ── Top-left: breadcrumb + options menu ───────────────────────── */}
      <div className="absolute top-3 left-3 flex items-stretch gap-2 z-30">
        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-lg border border-border/50 shadow-sm px-3 py-1.5 text-sm leading-none">
          <Link
            href={effectiveMapsBase}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Maps
          </Link>
          {trail.map((ancestor, i) => {
            const ancestorTrail = trail.slice(0, i).map((t) => t.slug).join(",");
            const href = `${effectiveMapsBase}/${ancestor.slug}${ancestorTrail ? `?trail=${ancestorTrail}` : ""}`;
            return (
              <span key={ancestor.slug} className="hidden sm:contents">
                <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {ancestor.name}
                </Link>
              </span>
            );
          })}
          <ChevronRight size={13} className="text-muted-foreground/50 shrink-0" />
          <span className="font-medium truncate max-w-32 sm:max-w-none">{map.name}</span>
        </div>

        {!readOnly && (
          <div className="bg-background/80 backdrop-blur-md rounded-lg border border-border/50 shadow-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-full w-8" aria-label="Map options">
                  <MoreHorizontal size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setCreateMapOpen(true)}>
                  <Plus size={13} className="mr-2" />
                  New map
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditMapOpen(true)}>
                  <Pencil size={13} className="mr-2" />
                  Edit map
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteMapOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={13} className="mr-2" />
                  Delete map
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Edit mode hint pill ───────────────────────────────────────── */}
      {editMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow pointer-events-none select-none">
          Click the map to place a pin · click a pin to edit it
        </div>
      )}

      {/* ── Bottom floating toolbar ───────────────────────────────────── */}
      <TooltipProvider delayDuration={300}>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg px-2 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => transformRef.current?.zoomIn()}>
                <ZoomIn size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => transformRef.current?.zoomOut()}>
                <ZoomOut size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => transformRef.current?.resetTransform()}>
                <Maximize2 size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Reset view</TooltipContent>
          </Tooltip>

          {!readOnly && (
            <>
              <div className="w-px h-5 bg-border mx-0.5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={editMode ? "default" : "ghost"}
                    onClick={() => setEditMode((v) => !v)}
                    className="gap-1.5 h-8 px-2 sm:px-3"
                  >
                    {editMode
                      ? <><X size={13} /><span className="hidden sm:inline">Done</span></>
                      : <><Pencil size={13} /><span className="hidden sm:inline">Edit pins</span></>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {editMode ? "Exit edit mode" : "Add or edit pins"}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>

      {/* ── Entity drawer ─────────────────────────────────────────────── */}
      {drawerEntity && drawerEntityType && (
        <EntityPreviewDrawer
          entity={drawerEntity}
          entityType={drawerEntityType}
          worldSlug={worldSlug}
          open={drawerOpen}
          hideOverlay
          readOnly={readOnly}
          onClose={() => {
            setDrawerOpen(false);
            setDrawerEntity(null);
            setDrawerEntityType(null);
          }}
        />
      )}

      {/* ── Floating pin editor ───────────────────────────────────────── */}
      {panelOpen && panelScreenPos && (
        <MapPinFloatingPanel
          screenPos={panelScreenPos}
          containerSize={{
            w: containerRef.current?.offsetWidth ?? 800,
            h: containerRef.current?.offsetHeight ?? 600,
          }}
          pendingPosition={pendingPos}
          existingPin={editingPin}
          mapId={map.id}
          allEntities={allEntities}
          allMaps={allMaps.filter((m) => m.id !== map.id)}
          onSaved={() => {
            setPanelOpen(false);
            setPendingPos(null);
            setEditingPin(null);
            router.refresh();
          }}
          onClose={() => {
            setPanelOpen(false);
            setPendingPos(null);
            setEditingPin(null);
          }}
        />
      )}

      {/* ── Map CRUD dialogs ──────────────────────────────────────────── */}
      <EditMapDialog map={map} open={editMapOpen} onOpenChange={setEditMapOpen} />
      <DeleteMapDialog map={map} worldSlug={worldSlug} open={deleteMapOpen} onOpenChange={setDeleteMapOpen} />
      <CreateMapDialog worldId={worldId} worldSlug={worldSlug} open={createMapOpen} onOpenChange={setCreateMapOpen} />
    </div>
  );
}

// ─── Pin marker ───────────────────────────────────────────────────────────────

interface MapPinMarkerProps {
  pin: MapPinWithRefs;
  scale: number;
  editMode: boolean;
  hovered: boolean;
  label: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function MapPinMarker({ pin, scale, editMode, hovered, label, onMouseEnter, onMouseLeave, onClick, onDelete }: MapPinMarkerProps) {
  const color = pin.color ?? "#3b82f6";
  const icon = pin.icon ?? "map-pin";
  // Counter-scale so the pin stays the same screen size at any zoom level.
  // transformOrigin "50% 100%" = bottom-center, keeping the anchor point fixed.
  const counterScale = 1 / scale;

  return (
    <div
      className="absolute"
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        zIndex: hovered ? 20 : 10,
      }}
    >
      {/* Visual wrapper — translate to anchor + counter-scale from bottom center */}
      <div
        style={{
          transform: `translate(-50%, -100%) scale(${counterScale})`,
          transformOrigin: "50% 100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-xs font-medium shadow-sm">
            {pin.linkedMap && <ChevronRight size={10} className="text-muted-foreground" />}
            {label}
          </div>
        </div>
      )}

      <button
        type="button"
        className={cn(
          "map-pin-btn relative flex items-center justify-center rounded-full transition-transform focus-visible:outline-none",
          "h-8 w-8 shadow-md border-2 border-white/70",
          hovered && "scale-125",
          editMode && "ring-2 ring-offset-1 ring-primary/50"
        )}
        style={{ backgroundColor: color }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        aria-label={label}
      >
        <DynamicIcon name={icon} size={14} className="text-white drop-shadow" />
        {editMode && hovered && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:bg-destructive/80 transition-colors"
            aria-label="Delete pin"
          >
            <X size={9} strokeWidth={3} />
          </button>
        )}
      </button>

      <div className="w-0.5 h-2 mx-auto" style={{ backgroundColor: color }} />
      </div>{/* end visual wrapper */}
    </div>
  );
}
