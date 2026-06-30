export type RoadmapStatus = "in-progress" | "planned" | "considering";
export type RoadmapCategory = "Core" | "Integration" | "Platform";

export interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  category: RoadmapCategory;
}

export const roadmap: RoadmapItem[] = [
  {
    title: "Timeline & History View",
    description:
      "A dedicated view for Event entities with chronicle, visual timeline, and era bands — giving your world's history a temporal home.",
    status: "in-progress",
    category: "Core",
  },
  {
    title: "Semantic Search",
    description:
      "Natural language search across your world. Ask questions like \"who rules the northern kingdom\" and get meaningful answers from your lore.",
    status: "planned",
    category: "Core",
  },
  {
    title: "Advanced Map Layers",
    description:
      "Region drawing, pin grouping, fog of war, and text annotations for your world maps.",
    status: "planned",
    category: "Core",
  },
  {
    title: "Audio Uploads",
    description:
      "Attach ambient music, soundscapes, and voice clips to locations, characters, and scenes.",
    status: "planned",
    category: "Core",
  },
  {
    title: "Foundry VTT Integration",
    description:
      "A Foundry VTT module that syncs your world's entities and lore as Journal Entries directly into your game — no re-importing.",
    status: "planned",
    category: "Integration",
  },
  {
    title: "Offline Support",
    description:
      "Install Subcreation as a desktop or tablet app and work on your world without an internet connection.",
    status: "planned",
    category: "Platform",
  },
];
