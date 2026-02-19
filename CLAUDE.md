# Orca - Agentic Orchestration Platform

## Project Overview
Orca is a standalone platform for agentic agents orchestration. It provides a modern dashboard for managing knowledge bases, data ingestion, widget configuration, and integrations.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Database**: Supabase (planned)
- **Authentication**: Supabase Auth (planned)

## Project Structure
```
src/
├── app/                    # Next.js pages (App Router)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, Header, DashboardLayout
│   ├── features/          # Dashboard sections
│   └── auth/              # Auth components
├── stores/                # Zustand stores
├── lib/                   # API client, utilities
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks

.claude/skills/            # Claude Code skills
├── orca-dev/             # Development workflow
├── orca-deploy/          # Deployment commands
├── orca-component/       # Component generation
├── orca-api/             # API route generation
└── orca-agent/           # Agent orchestration
```

## Available Skills
- `/orca-dev` - Start dev server, build, lint
- `/orca-deploy` - Deploy to Vercel
- `/orca-component` - Generate new components
- `/orca-api` - Create API routes
- `/orca-agent` - Agent orchestration setup

## Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Key Files
- `src/lib/api.ts` - API client for backend communication
- `src/stores/app-store.ts` - Global state management
- `src/components/layout/sidebar.tsx` - Navigation sidebar
- `src/components/features/` - Dashboard section components

## Conventions
- Use `'use client'` directive for client components
- Import with `@/` alias for src paths
- Use Tailwind CSS for styling
- Use lucide-react for icons
- Use framer-motion for animations
