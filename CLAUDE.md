# Orca - Agentic Orchestration Platform

## Project Overview
Orca is a standalone platform for agentic agents orchestration. It provides a modern dashboard for managing knowledge bases, data ingestion, widget configuration, and integrations.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure
```
src/
├── app/                    # Next.js pages (App Router)
│   ├── auth/callback/     # OAuth & email verification callback
│   ├── dashboard/         # Protected dashboard routes
│   └── login/             # Login page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, Header, DashboardLayout
│   ├── features/          # Dashboard sections
│   └── auth/              # Auth components
├── lib/
│   ├── supabase/          # Supabase clients (client, server, middleware)
│   └── api.ts             # API client for backend
├── stores/                # Zustand stores
├── types/
│   ├── database.ts        # Supabase database types
│   └── index.ts           # General types
└── hooks/                 # Custom React hooks

supabase/
└── migrations/            # Database migrations

.claude/skills/            # Claude Code skills
├── orca-dev/             # Development workflow
├── orca-deploy/          # Deployment commands
├── orca-component/       # Component generation
├── orca-api/             # API route generation
├── orca-agent/           # Agent orchestration
└── db-engineer/          # Database operations via Supabase MCP
```

## Available Skills
- `/orca-dev` - Start dev server, build, lint
- `/orca-deploy` - Deploy to Vercel
- `/orca-component` - Generate new components
- `/orca-api` - Create API routes
- `/orca-agent` - Agent orchestration setup
- `/db-engineer` - Database operations (schema, queries, migrations)

## Database Schema
Tables: `profiles`, `agents`, `workflows`, `knowledge_bases`, `integrations`

Run migrations:
```bash
# Copy SQL from supabase/migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and run
```

## MCP Configuration
Supabase MCP server configured in `.mcp.json`:
- Uses `@modelcontextprotocol/server-supabase`
- Provides: `query`, `list_tables`, `describe_table` tools
- Enabled via `.claude/settings.local.json`

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Key Files
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server.ts` - Server Supabase client
- `middleware.ts` - Auth middleware (protects /dashboard)
- `src/types/database.ts` - Database types
- `src/stores/app-store.ts` - Global state management
- `src/components/layout/sidebar.tsx` - Navigation sidebar

## Conventions
- Use `'use client'` directive for client components
- Import with `@/` alias for src paths
- Use Tailwind CSS for styling
- Use lucide-react for icons
- Use framer-motion for animations
- Use Supabase MCP for database exploration, Supabase client for auth
