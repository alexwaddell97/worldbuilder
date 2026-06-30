export interface Announcement {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
  content: string;
}

export const announcements: Announcement[] = [
  {
    slug: "building-in-public",
    title: "Building Subcreation in public",
    date: "2026-06-30",
    image: "/landscape.png",
    excerpt:
      "Subcreation is a worldbuilding tool for writers and game masters. Here's why we're building it in public, what's already shipped, and what's coming next.",
    content: `Subcreation is a worldbuilding tool built for writers and game masters who need more than a folder of notes, but less than the sprawling complexity of tools like World Anvil. We've been building quietly for a few months. Today we're opening the doors to an early alpha and inviting anyone who wants to kick the tyres, break things, and help shape what this becomes.

What's already built

The core of Subcreation is working. You can create worlds, build custom entity types for whatever your setting needs (characters, locations, factions, gods, artefacts) and connect them with wikilinks. A relationship graph gives you a visual map of how everything in your world connects.

There's also a writing workspace built in: projects, documents, word goals, and a distraction-free focus mode for when you need to actually write. Spotlight search (Cmd+K) lets you find anything in your world instantly without leaving your flow.

What's coming next

The timeline view is next on the list. Every world has history, and right now there's no good way to see it laid out chronologically. That changes soon.

After that: semantic search so you can ask your world questions in plain English, Foundry VTT integration for GMs who run games there, and offline support so your world is always accessible even without a connection.

How you can help

The most valuable thing right now is real feedback from real worldbuilders. What's missing? What feels wrong? What would make you open this every day instead of reaching for a Google Doc?

Join the Discord, build something, and tell us. Every piece of feedback shapes what gets built next.`,
  },
];
