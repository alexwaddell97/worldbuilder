// 40 curated Lucide icon names for the entity type icon picker.
// All strings are valid Lucide icon names (lowercase-hyphenated format).
export const ICON_PICKER_OPTIONS = [
  // People & characters
  "user",
  "users",
  "user-round",
  "crown",
  "shield",
  "sword",
  "wand",
  "graduation-cap",
  // Places & locations
  "map-pin",
  "map",
  "castle",
  "mountain",
  "trees",
  "building",
  "building-2",
  "home",
  "warehouse",
  "tent",
  // Objects & items
  "package",
  "gem",
  "key",
  "scroll",
  "book",
  "book-open",
  "flask-conical",
  "hammer",
  "swords",
  "wand-2",
  // Events & time
  "calendar",
  "clock",
  "zap",
  "flame",
  "sun",
  "moon",
  "star",
  // Groups & factions
  "flag",
  "globe",
  "network",
  "layers",
  "tag",
] as const;

export type IconPickerOption = (typeof ICON_PICKER_OPTIONS)[number];
