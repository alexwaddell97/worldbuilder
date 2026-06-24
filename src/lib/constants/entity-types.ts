export type EntityTypeDefinition = {
  name: string;
  slug: string;
  icon: string;
};

export type WorldPreset = {
  label: string;
  description: string;
  icon: string;
  entityTypes: EntityTypeDefinition[];
};

export const WORLD_PRESETS = {
  fantasy: {
    label: "Fantasy",
    description: "Magic, mythical creatures, medieval kingdoms, and epic quests.",
    icon: "wand-2",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "user"       },
      { name: "Location",   slug: "location",   icon: "map-pin"    },
      { name: "Faction",    slug: "faction",    icon: "shield"     },
      { name: "Species",    slug: "species",    icon: "users"      },
      { name: "Creature",   slug: "creature",   icon: "swords"     },
      { name: "Item",       slug: "item",       icon: "gem"        },
      { name: "Magic",      slug: "magic",      icon: "wand-2"     },
      { name: "Religion",   slug: "religion",   icon: "sun"        },
      { name: "Event",      slug: "event",      icon: "calendar"   },
      { name: "Lore",       slug: "lore",       icon: "book-open"  },
    ],
  },
  "sci-fi": {
    label: "Sci-Fi",
    description: "Starships, alien civilisations, advanced technology, and galactic conflict.",
    icon: "globe",
    entityTypes: [
      { name: "Character",   slug: "character",   icon: "user"           },
      { name: "Location",    slug: "location",    icon: "map-pin"        },
      { name: "Faction",     slug: "faction",     icon: "shield"         },
      { name: "Species",     slug: "species",     icon: "users"          },
      { name: "Creature",    slug: "creature",    icon: "zap"            },
      { name: "Technology",  slug: "technology",  icon: "flask-conical"  },
      { name: "Item",        slug: "item",        icon: "gem"            },
      { name: "Vessel",      slug: "vessel",      icon: "globe"          },
      { name: "Event",       slug: "event",       icon: "calendar"       },
      { name: "Lore",        slug: "lore",        icon: "book-open"      },
    ],
  },
  horror: {
    label: "Horror",
    description: "Dark mysteries, cursed artefacts, eldritch horrors, and unsettling cults.",
    icon: "moon",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "user"       },
      { name: "Location",   slug: "location",   icon: "map-pin"    },
      { name: "Faction",    slug: "faction",    icon: "shield"     },
      { name: "Creature",   slug: "creature",   icon: "moon"       },
      { name: "Item",       slug: "item",       icon: "key"        },
      { name: "Cult",       slug: "cult",       icon: "flame"      },
      { name: "Event",      slug: "event",      icon: "calendar"   },
      { name: "Lore",       slug: "lore",       icon: "book-open"  },
      { name: "Mystery",    slug: "mystery",    icon: "star"       },
    ],
  },
  historical: {
    label: "Historical",
    description: "Empires, real-world-inspired cultures, wars, and historical figures.",
    icon: "scroll",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "user"       },
      { name: "Location",   slug: "location",   icon: "map-pin"    },
      { name: "Faction",    slug: "faction",    icon: "shield"     },
      { name: "Item",       slug: "item",       icon: "gem"        },
      { name: "Religion",   slug: "religion",   icon: "sun"        },
      { name: "Language",   slug: "language",   icon: "scroll"     },
      { name: "Event",      slug: "event",      icon: "calendar"   },
      { name: "Lore",       slug: "lore",       icon: "book-open"  },
    ],
  },
  mythology: {
    label: "Mythology",
    description: "Gods, demigods, legendary beasts, sacred artefacts, and creation myths.",
    icon: "star",
    entityTypes: [
      { name: "Deity",     slug: "deity",     icon: "sun"        },
      { name: "Hero",      slug: "hero",      icon: "crown"      },
      { name: "Location",  slug: "location",  icon: "map-pin"    },
      { name: "Creature",  slug: "creature",  icon: "flame"      },
      { name: "Artifact",  slug: "artifact",  icon: "gem"        },
      { name: "Myth",      slug: "myth",      icon: "star"       },
      { name: "Faction",   slug: "faction",   icon: "shield"     },
      { name: "Event",     slug: "event",     icon: "calendar"   },
    ],
  },
  fiction: {
    label: "Fiction & Storytelling",
    description: "Plot-driven narratives, character arcs, and story structure.",
    icon: "book-open",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "user"       },
      { name: "Location",   slug: "location",   icon: "map-pin"    },
      { name: "Faction",    slug: "faction",    icon: "shield"     },
      { name: "Item",       slug: "item",       icon: "gem"        },
      { name: "Event",      slug: "event",      icon: "calendar"   },
      { name: "Plot",       slug: "plot",       icon: "network"    },
      { name: "Lore",       slug: "lore",       icon: "book-open"  },
    ],
  },
  blank: {
    label: "Blank Slate",
    description: "Start fresh with no entity types. Build your own from scratch.",
    icon: "layers",
    entityTypes: [],
  },
} as const satisfies Record<string, WorldPreset>;

export type PresetId = keyof typeof WORLD_PRESETS;
export const PRESET_IDS = Object.keys(WORLD_PRESETS) as PresetId[];
