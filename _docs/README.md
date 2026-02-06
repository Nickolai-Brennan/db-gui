# db-gui

A modern, checklist-first database studio with interactive ERD visualization.

## Vision

db-gui is an ERD-first database management tool that overlays intelligent checklists onto your database schema. Instead of just viewing tables and relationships, you get actionable insights about data integrity, foreign key health, missing indexes, and schema quality—all directly annotated on the ERD.

## Principles

- **Checklist-First**: Every schema inspection is guided by configurable checklists
- **Visual Annotations**: Issues and recommendations appear directly on the ERD
- **Actionable Insights**: Focus on what matters with severity-based filtering
- **Multi-Dialect**: Start with Postgres, expand to MySQL, SQLite, and more
- **Developer-Friendly**: Built with modern TypeScript, React, and Fastify

## Project Structure

This is a pnpm monorepo with:

- `apps/web` - React + Vite frontend with ERD viewer
- `apps/api` - Fastify backend with introspection and checklist APIs
- `packages/shared` - Shared types between web and api

## Getting Started

### Prerequisites

- Node.js 20 (see `.nvmrc`)
- pnpm 9.15.0+
- PostgreSQL (for app database and target databases)

### Installation

```bash
# Install dependencies
pnpm install

# Start both web and api in dev mode
pnpm dev

# Or run individually
pnpm --filter web dev    # Frontend on http://localhost:5173
pnpm --filter api dev    # Backend on http://localhost:3001
```

### Environment Setup

Copy `.env.example` to `.env` and configure your database connection:

```bash
cp .env.example .env
```

### Development Commands

```bash
pnpm typecheck  # Type check all packages
pnpm lint       # Lint all packages
pnpm format     # Format all packages with Prettier
pnpm build      # Build all packages
```

## Features (v1)

- ✅ Postgres schema introspection
- ✅ Interactive ERD with pan/zoom
- ✅ Built-in integrity checks (missing PKs, unindexed FKs, FK violations)
- ✅ Visual annotations on ERD (badges and severity indicators)
- ✅ Inspector panel for detailed table/column info
- ✅ Configurable checklist system

## Roadmap

- Custom checklist creation
- Multi-database support (MySQL, SQLite)
- Schema diff and migration suggestions
- Query performance analysis
- Team collaboration features

## License

MIT