---
name: orca-dev
description: Start Orca development server, run tests, lint code, and manage development workflow. Use when working on Orca locally.
allowed-tools: Bash(npm *), Bash(npx *), Read, Glob, Grep
---

# Orca Development

Start and manage the Orca development environment.

## Quick Commands

### Start Development Server
```bash
npm run dev
```
The server runs on http://localhost:3000

### Build for Production
```bash
npm run build
```

### Run Linting
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication page
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── features/          # Feature sections
│   └── auth/              # Auth components
├── stores/                # Zustand state management
├── lib/                   # Utilities and API client
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **State**: Zustand
- **Animations**: Framer Motion
- **Database**: Supabase (planned)
- **Auth**: Supabase Auth (planned)

## Environment Variables

Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Common Tasks

1. **Add a new shadcn component**:
   ```bash
   npx shadcn@latest add <component-name>
   ```

2. **Create a new feature section**: Add to `src/components/features/`

3. **Update API client**: Edit `src/lib/api.ts`

4. **Modify navigation**: Edit `src/components/layout/sidebar.tsx`
