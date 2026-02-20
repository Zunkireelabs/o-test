# Orca - Developer Handover Document

**Project**: Orca - Agentic Orchestration Platform
**Handover Date**: 2026-02-20
**From**: Sadin Shrestha
**To**: Anish

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Zunkireelabs/o-test.git orca
cd orca

# Install dependencies
npm install

# Set up environment variables (see Environment Setup below)
cp .env.example .env.local
# Edit .env.local with the credentials below

# Run development server
npm run dev
```

---

## Project Overview

Orca is a standalone platform for agentic agents orchestration. It provides a modern dashboard for managing AI agents, workflows, knowledge bases, and integrations.

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Animations | Framer Motion |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Deployment | Vercel (auto-deploy from GitHub) |

---

## Environment Setup

### Required Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cincwjswuyxpjuxdlxwe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbmN3anN3dXl4cGp1eGRseHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Njk3MjgsImV4cCI6MjA4NzE0NTcyOH0.yFWQdvL79K9tJKVwlEzXHd77CqEoOROIDxZ97LD9oEo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbmN3anN3dXl4cGp1eGRseHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU2OTcyOCwiZXhwIjoyMDg3MTQ1NzI4fQ.CckRgmRBpqFkmsHjoJ1j603rUxN7Aw3MjJh2269vxLM

# Database URL (for direct PostgreSQL access)
DATABASE_URL=postgresql://postgres:lEtikJmyzPOtyXc1@db.cincwjswuyxpjuxdlxwe.supabase.co:5432/postgres
```

### MCP Configuration (for Claude Code)

Create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": ""
      }
    }
  }
}
```

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": []
  },
  "enabledMcpjsonServers": ["supabase"],
  "enableAllProjectMcpServers": true
}
```

---

## Supabase Project Details

| Item | Value |
|------|-------|
| Project Name | Orca |
| Organization | Zunkiree-Org |
| Project ID | `cincwjswuyxpjuxdlxwe` |
| Region | Asia-Pacific (ap-south-1) |
| Dashboard | https://supabase.com/dashboard/project/cincwjswuyxpjuxdlxwe |
| Database Password | `lEtikJmyzPOtyXc1` |

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (auto-created on signup via trigger) |
| `agents` | Task/orchestrator/connector agents |
| `workflows` | Multi-step agent workflows |
| `knowledge_bases` | Data sources for agents |
| `integrations` | External service connections |

### Key Features
- **Row Level Security (RLS)** enabled on all tables
- **Auto-create profile trigger**: When a user signs up, a profile is automatically created
- **Updated_at triggers**: All tables auto-update the `updated_at` field on changes

### Schema File
Full schema is in: `supabase/migrations/001_initial_schema.sql`

---

## Authentication

### Current Setup
- Email/password authentication via Supabase Auth
- OAuth buttons exist in UI but providers not yet enabled

### Test Account
| Field | Value |
|-------|-------|
| Email | `admin@gmail.com` |
| Password | `admin123` |

### Creating New Users (via code)
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create user with auto-confirmed email
await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  email_confirm: true
});
```

---

## Project Structure

```
orca/
├── .claude/
│   ├── settings.local.json    # MCP enablement
│   └── skills/                # Claude Code skills
│       ├── db-engineer/       # Database operations
│       ├── orca-dev/          # Development workflow
│       ├── orca-deploy/       # Deployment commands
│       ├── orca-component/    # Component generation
│       ├── orca-api/          # API route generation
│       └── orca-agent/        # Agent orchestration
├── .mcp.json                  # Supabase MCP config
├── .env.local                 # Environment variables (not in git)
├── middleware.ts              # Auth middleware
├── src/
│   ├── app/
│   │   ├── api/integrations/oauth/  # OAuth API routes
│   │   │   ├── [provider]/authorize/route.ts
│   │   │   └── callback/route.ts
│   │   ├── auth/callback/     # Supabase auth callback
│   │   ├── dashboard/         # Protected dashboard routes
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Sidebar, Header, DashboardLayout
│   │   ├── features/          # Dashboard sections
│   │   └── auth/              # Auth components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser Supabase client
│   │   │   ├── server.ts      # Server Supabase client
│   │   │   └── middleware.ts  # Session management
│   │   ├── integrations/
│   │   │   └── providers.ts   # 30+ OAuth provider configs
│   │   └── api.ts             # API client (legacy)
│   ├── stores/                # Zustand stores
│   ├── types/
│   │   ├── database.ts        # Supabase database types
│   │   └── index.ts           # General types
│   └── hooks/                 # Custom React hooks
└── supabase/
    └── migrations/            # Database migrations
```

---

## Available Claude Code Skills

Use these slash commands in Claude Code:

| Skill | Description |
|-------|-------------|
| `/orca-dev` | Start dev server, build, lint |
| `/orca-deploy` | Deploy to Vercel |
| `/orca-component` | Generate new components |
| `/orca-api` | Create API routes |
| `/orca-agent` | Agent orchestration setup |
| `/db-engineer` | Database operations (schema, queries, migrations) |

---

## Deployment

### Vercel Setup
- **Project**: https://vercel.com/sthasadins-projects/o-test
- **Production URL**: https://o-test-two.vercel.app
- **Auto-deploy**: Connected to GitHub repo, deploys on push to `main`

### Environment Variables (already set in Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

---

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

---

## Current State & What's Working

### Working
- Database schema deployed with 5 tables
- RLS policies active on all tables
- Supabase client libraries ready
- Auth middleware protecting `/dashboard` routes
- Email/password login flow
- Auto-create profile on signup
- Build passes
- Vercel deployment working
- **Dashboard uses Supabase Auth** (shows user name, online status)
- **OAuth Integrations UI** with 30+ providers
- **OAuth API routes** for connect/disconnect flow

### Login Flow
1. User visits `/login`
2. Enters email/password
3. On success, redirected to `/dashboard`
4. If not logged in and tries `/dashboard`, redirected to `/login`

### Dashboard Features
- Header shows "Online" when connected to Supabase
- User name displayed from profile
- Logout via Supabase Auth
- Integrations page shows 30+ OAuth providers with Connect/Disconnect buttons

---

## Pending / Future Work

1. **OAuth Provider Credentials**: Add client IDs/secrets for each provider (see Integrations section)
2. **Login OAuth**: Enable Google, Microsoft, Apple login in Supabase dashboard
3. **Agents CRUD**: Create, read, update, delete agents UI
4. **Workflows**: Build workflow designer/executor
5. **Knowledge Bases**: Implement data ingestion
6. **Integration Sync**: Implement data sync for connected integrations (e.g., Notion sync)

---

## Key Files to Understand

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth middleware, protects routes |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/lib/integrations/providers.ts` | OAuth provider configurations (30+) |
| `src/app/login/page.tsx` | Login page component |
| `src/app/dashboard/page.tsx` | Dashboard page |
| `src/app/api/integrations/oauth/` | OAuth API routes |
| `src/components/features/connectors-section.tsx` | Integrations UI |
| `src/stores/app-store.ts` | Global Zustand store |
| `src/types/database.ts` | TypeScript types for DB tables |

---

## Integrations System

### Architecture
The integrations system allows users to connect external services via OAuth.

```
User clicks Connect
       ↓
Frontend calls /api/integrations/oauth/[provider]/authorize
       ↓
API returns authorization URL
       ↓
User redirected to provider (e.g., Notion, GitHub)
       ↓
User grants consent
       ↓
Provider redirects to /api/integrations/oauth/callback
       ↓
Callback exchanges code for tokens
       ↓
Tokens stored in Supabase `integrations` table
       ↓
User redirected to dashboard with success notification
```

### Available Providers (30+)
Defined in `src/lib/integrations/providers.ts`:

| Category | Providers |
|----------|-----------|
| Productivity | Notion, Google Drive, Google Docs, OneDrive, Dropbox, Airtable |
| Communication | Slack, Microsoft Teams, Gmail, Discord, Zoom |
| Project Management | Jira, Confluence, Asana, Trello, Linear, ClickUp |
| Developer Tools | GitHub, GitLab, Bitbucket, Figma |
| CRM & Sales | Salesforce, HubSpot, Pipedrive |
| Support | Zendesk, Intercom |
| Social Media | LinkedIn, Twitter/X |

### Adding OAuth Credentials

To enable a provider, add environment variables in Vercel:

```bash
# Example for Notion
NOTION_CLIENT_ID=your-client-id
NOTION_CLIENT_SECRET=your-client-secret

# Example for GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# App URL (required for OAuth callbacks)
NEXT_PUBLIC_APP_URL=https://o-test-two.vercel.app
```

### Creating OAuth Apps

For each provider you want to enable:

1. **Notion**: https://www.notion.so/my-integrations → Create OAuth integration
2. **GitHub**: https://github.com/settings/developers → New OAuth App
3. **Slack**: https://api.slack.com/apps → Create New App
4. **Google**: https://console.cloud.google.com → APIs & Services → Credentials

Set the callback URL to: `https://your-domain.vercel.app/api/integrations/oauth/callback`

### Database Schema for Integrations

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  provider TEXT NOT NULL,        -- e.g., 'notion', 'github'
  name TEXT NOT NULL,            -- Display name
  credentials JSONB,             -- { access_token, refresh_token, expires_at }
  config JSONB,                  -- { external_account_id, connected_at }
  status integration_status,     -- 'connected', 'disconnected', 'error'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Conventions

- Use `'use client'` directive for client components
- Import with `@/` alias for src paths
- Use Tailwind CSS for styling
- Use lucide-react for icons
- Use framer-motion for animations
- Use Supabase client for auth, MCP for database exploration

---

## Troubleshooting

### Middleware 500 Error
If you see `MIDDLEWARE_INVOCATION_FAILED`:
1. Check environment variables are set
2. The middleware now has defensive checks and try-catch

### Can't Connect to Database
1. Verify `.env.local` has correct credentials
2. Check Supabase project is active (free tier pauses after inactivity)

### Auth Not Working
1. Check Supabase Auth settings in dashboard
2. Verify callback URL is correct: `{YOUR_URL}/auth/callback`

---

## Contact

For questions about this handover, reach out to Sadin.

---

*Last updated: 2026-02-20 (OAuth Integrations added)*
