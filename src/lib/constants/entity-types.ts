export type EntityTypeDefinition = {
  name: string;
  slug: string;
  icon: string;
  namePlural?: string;
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
    icon: "gi:magic-swirl",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "gi:cowled"          },
      { name: "Location",   slug: "location",   icon: "gi:position-marker" },
      { name: "Faction",    slug: "faction",    icon: "gi:shield"          },
      { name: "Species",    slug: "species",    icon: "gi:two-shadows"     },
      { name: "Creature",   slug: "creature",   icon: "gi:dragon-head"     },
      { name: "Item",       slug: "item",       icon: "gi:crystal-shine"   },
      { name: "Magic",      slug: "magic",      icon: "gi:magic-swirl"     },
      { name: "Religion",   slug: "religion",   icon: "gi:sun"             },
      { name: "Event",      slug: "event",      icon: "gi:pocket-watch"    },
      { name: "Lore",       slug: "lore",       icon: "gi:spell-book",      namePlural: "Lore" },
    ],
  },
  "sci-fi": {
    label: "Sci-Fi",
    description: "Starships, alien civilisations, advanced technology, and galactic conflict.",
    icon: "gi:rocket",
    entityTypes: [
      { name: "Character",   slug: "character",   icon: "gi:cowled"          },
      { name: "Location",    slug: "location",    icon: "gi:globe"           },
      { name: "Faction",     slug: "faction",     icon: "gi:shield"          },
      { name: "Species",     slug: "species",     icon: "gi:two-shadows"     },
      { name: "Creature",    slug: "creature",    icon: "gi:alien-stare"     },
      { name: "Technology",  slug: "technology",  icon: "gi:circuitry"       },
      { name: "Item",        slug: "item",        icon: "gi:crystal-shine"   },
      { name: "Vessel",      slug: "vessel",      icon: "gi:spaceship"       },
      { name: "Event",       slug: "event",       icon: "gi:pocket-watch"    },
      { name: "Lore",        slug: "lore",        icon: "gi:spell-book",      namePlural: "Lore" },
    ],
  },
  horror: {
    label: "Horror",
    description: "Dark mysteries, cursed artefacts, eldritch horrors, and unsettling cults.",
    icon: "gi:death-skull",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "gi:cowled"           },
      { name: "Location",   slug: "location",   icon: "gi:graveyard"        },
      { name: "Faction",    slug: "faction",    icon: "gi:shield"           },
      { name: "Creature",   slug: "creature",   icon: "gi:skull-mask"       },
      { name: "Item",       slug: "item",       icon: "gi:key"              },
      { name: "Cult",       slug: "cult",       icon: "gi:candle-skull"     },
      { name: "Event",      slug: "event",      icon: "gi:pocket-watch"     },
      { name: "Lore",       slug: "lore",       icon: "gi:spell-book",       namePlural: "Lore" },
      { name: "Mystery",    slug: "mystery",    icon: "gi:star-formation"   },
    ],
  },
  historical: {
    label: "Historical",
    description: "Empires, real-world-inspired cultures, wars, and historical figures.",
    icon: "gi:ancient-sword",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "gi:cowled"          },
      { name: "Location",   slug: "location",   icon: "gi:position-marker" },
      { name: "Faction",    slug: "faction",    icon: "gi:flag-objective"  },
      { name: "Item",       slug: "item",       icon: "gi:crystal-shine"   },
      { name: "Religion",   slug: "religion",   icon: "gi:sun"             },
      { name: "Language",   slug: "language",   icon: "gi:scroll-unfurled" },
      { name: "Event",      slug: "event",      icon: "gi:pocket-watch"    },
      { name: "Lore",       slug: "lore",       icon: "gi:spell-book",      namePlural: "Lore" },
    ],
  },
  mythology: {
    label: "Mythology",
    description: "Gods, demigods, legendary beasts, sacred artefacts, and creation myths.",
    icon: "gi:star-formation",
    entityTypes: [
      { name: "Deity",     slug: "deity",     icon: "gi:coronation"      },
      { name: "Hero",      slug: "hero",      icon: "gi:crown"           },
      { name: "Location",  slug: "location",  icon: "gi:greek-temple"    },
      { name: "Creature",  slug: "creature",  icon: "gi:minotaur"        },
      { name: "Artifact",  slug: "artifact",  icon: "gi:boss-key"        },
      { name: "Myth",      slug: "myth",      icon: "gi:star-formation"  },
      { name: "Faction",   slug: "faction",   icon: "gi:shield"          },
      { name: "Event",     slug: "event",     icon: "gi:pocket-watch"    },
    ],
  },
  fiction: {
    label: "Fiction & Storytelling",
    description: "Plot-driven narratives, character arcs, and story structure.",
    icon: "gi:spell-book",
    entityTypes: [
      { name: "Character",  slug: "character",  icon: "gi:cowled"          },
      { name: "Location",   slug: "location",   icon: "gi:position-marker" },
      { name: "Faction",    slug: "faction",    icon: "gi:shield"          },
      { name: "Item",       slug: "item",       icon: "gi:crystal-shine"   },
      { name: "Event",      slug: "event",      icon: "gi:pocket-watch"    },
      { name: "Plot",       slug: "plot",       icon: "gi:compass"         },
      { name: "Lore",       slug: "lore",       icon: "gi:spell-book",      namePlural: "Lore" },
    ],
  },
  blank: {
    label: "Blank Slate",
    description: "Start fresh with no entity types. Build your own from scratch.",
    icon: "gi:world",
    entityTypes: [],
  },
} as const satisfies Record<string, WorldPreset>;

export type PresetId = keyof typeof WORLD_PRESETS;
export const PRESET_IDS = Object.keys(WORLD_PRESETS) as PresetId[];
