# Subcreation

A worldbuilding tool for fiction authors, game masters, and anyone building a world for the love of it. Organise your lore, connect your entities, and write with your world open beside you.

**subcreation.app** — currently in early alpha (v0.1.0)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Editor | Tiptap v3 |
| Database | Neon (Postgres), Drizzle ORM |
| Auth | Better Auth |
| Storage | Vercel Blob |
| Email | Resend |
| Graph | React Flow (XY Flow) |
| Maps | Konva / react-konva |
| Icons | Iconify (game-icons set) |

## Getting started

### Prerequisites

- Node.js 20+
- A Neon database (or any Postgres instance)

### Local setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, VERCEL_BLOB_READ_WRITE_TOKEN, RESEND_API_KEY

# Push the schema
pnpm drizzle-kit push

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    (marketing)/     # Public marketing pages (home, pricing, announcements, roadmap, changelog)
    (app)/           # Authenticated app shell
    api/             # API routes and auth handler
  components/
    ui/              # shadcn/ui primitives
    marketing/       # Marketing-specific components (header, nav)
    entity-types/    # Entity type management and icon picker
    layout/          # App shell (sidebar, etc.)
  content/
    announcements.ts # Blog post content
    roadmap.ts       # Roadmap items
  lib/
    auth/            # Better Auth config
    db/              # Drizzle schema and client
  stores/            # Zustand client stores
```

## Versioning

Releases are managed with [release-please](https://github.com/googleapis/release-please). Merge the release PR that appears on `main` to cut a new version and tag.

## Community

[Join the Discord](https://discord.gg/d4nYK9nZG8) to give feedback, report bugs, or follow development.
