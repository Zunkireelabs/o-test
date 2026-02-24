# ORCA - Agentic Orchestration Platform
## Technical Summary & Feature Documentation

**Version:** 0.1.0
**Branch:** `dev` (development)
**Last Updated:** February 2026

---

## 1. EXECUTIVE SUMMARY

Orca is a **standalone agentic AI orchestration platform** built with a modern tech stack. It provides a dashboard for managing AI agents, workflows, knowledge bases, and third-party integrations. The platform includes a conversational AI interface with voice capabilities and tool-calling (function execution) powered by GPT-4o.

### Current State
- **Foundation:** Complete and production-ready
- **Authentication:** Fully implemented with Supabase
- **Chat Interface:** Working with streaming, voice, and AI tools
- **Integrations:** 26+ OAuth providers configured, 5 fully functional APIs
- **Database:** Schema deployed with RLS security

---

## 2. TECH STACK

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Runtime** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | Latest |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui + Radix UI | Latest |
| **Animations** | Framer Motion | 12.34.2 |
| **State** | Zustand | 5.0.11 |
| **AI** | OpenAI (GPT-4o, TTS) | 6.22.0 |
| **Scraping** | Cheerio | 1.2.0 |

---

## 3. FEATURES IMPLEMENTED

### 3.1 Authentication System
| Feature | Status | Details |
|---------|--------|---------|
| Email/Password Auth | Complete | Sign up & sign in |
| OAuth Providers | Complete | Google, Azure, Apple |
| Session Management | Complete | Middleware-protected routes |
| Auto Profile Creation | Complete | Trigger on signup |
| Protected Dashboard | Complete | `/dashboard/*` routes secured |

### 3.2 Chat & Voice Interface
| Feature | Status | Details |
|---------|--------|---------|
| Streaming Chat | Complete | Real-time GPT-4o responses |
| Voice Input | Complete | Web Speech API |
| Text-to-Speech | Complete | OpenAI TTS-1 |
| Voice Mode | Complete | Full loop: speak → listen → auto-send |
| Message History | Complete | Persistent in session |
| Quick Actions | Complete | Navigation buttons |

### 3.3 AI Tools (Function Calling)
| Tool | Category | Description |
|------|----------|-------------|
| `send_email` | Communication | Send emails via Gmail API |
| `create_meeting` | Communication | Create Google Meet conferences |
| `list_upcoming_meetings` | Communication | View calendar events |
| `get_meeting_details` | Communication | Event details |
| `search_places` | Maps | Search restaurants, hotels, POIs |
| `get_directions` | Maps | Routing between locations |
| `get_place_details` | Maps | Business info, hours, contact |
| `web_search` | Browsing | DuckDuckGo search |
| `browse_url` | Browsing | Extract web page content |

### 3.4 Integration System
| Feature | Status | Details |
|---------|--------|---------|
| Provider Registry | Complete | 26 OAuth providers defined |
| OAuth Flow | Complete | Authorization + callback |
| Credential Storage | Complete | Per-user database storage |
| Credential Families | Complete | Shared credentials (Google suite, etc.) |
| Setup Wizard | Complete | Step-by-step credential entry |
| CSRF Protection | Complete | State tokens |

### 3.5 Dashboard Sections
| Section | Status | Functionality |
|---------|--------|---------------|
| **New Task** | Functional | Chat interface with voice |
| **Connectors** | Functional | Browse & connect integrations |
| **Ingest** | UI Only | File/URL/text upload interface |
| **Jobs** | UI Only | Job status monitoring shell |
| **Knowledge** | UI Only | Knowledge base management shell |
| **Widget Config** | UI Only | Brand/tone customization shell |
| **Embed** | UI Only | Embed code generation shell |
| **Profile** | UI Only | User settings shell |

---

## 4. SUPPORTED INTEGRATIONS

### 4.1 Fully Implemented APIs
| Provider | Capabilities |
|----------|--------------|
| **Gmail** | Send emails, read inbox, token refresh |
| **Google Meet** | Create/list/manage meetings |
| **Google Maps** | Place search, directions, details (free APIs) |
| **Web Browsing** | DuckDuckGo search, URL content extraction |
| **OpenAI** | Chat (GPT-4o), Text-to-Speech |

### 4.2 OAuth Providers Ready
**Productivity:** Notion, Google Drive, Google Docs, Google Calendar, Google Sheets, OneDrive, Dropbox, Airtable

**Communication:** Slack, Microsoft Teams, Gmail, Discord, Google Meet, Zoom

**Project Management:** Jira, Confluence, Asana, Trello, Linear, ClickUp

**Developer Tools:** GitHub, GitLab, Bitbucket, Figma

**CRM & Sales:** Salesforce, HubSpot, Pipedrive

**Support:** Zendesk, Intercom

**Social Media:** LinkedIn, Twitter/X

---

## 5. DATABASE SCHEMA

### 5.1 Tables

```
┌─────────────────────┐     ┌─────────────────────┐
│      profiles       │     │       agents        │
├─────────────────────┤     ├─────────────────────┤
│ id (PK, FK→auth)    │←────│ user_id (FK)        │
│ email               │     │ id (PK)             │
│ name                │     │ name                │
│ avatar_url          │     │ description         │
│ created_at          │     │ type (enum)         │
│ updated_at          │     │ config (JSONB)      │
└─────────────────────┘     │ status (enum)       │
         │                  └─────────────────────┘
         │
         │   ┌─────────────────────┐
         ├──→│     workflows       │
         │   ├─────────────────────┤
         │   │ id (PK)             │
         │   │ user_id (FK)        │
         │   │ name                │
         │   │ steps (JSONB)       │
         │   │ status (enum)       │
         │   └─────────────────────┘
         │
         │   ┌─────────────────────┐
         ├──→│  knowledge_bases    │
         │   ├─────────────────────┤
         │   │ id (PK)             │
         │   │ user_id (FK)        │
         │   │ name                │
         │   │ source_type (enum)  │
         │   │ document_count      │
         │   │ status (enum)       │
         │   └─────────────────────┘
         │
         │   ┌─────────────────────┐
         ├──→│    integrations     │
         │   ├─────────────────────┤
         │   │ id (PK)             │
         │   │ user_id (FK)        │
         │   │ provider            │
         │   │ credentials (JSONB) │
         │   │ status (enum)       │
         │   └─────────────────────┘
         │
         │   ┌─────────────────────────┐
         └──→│  provider_credentials   │
             ├─────────────────────────┤
             │ id (PK)                 │
             │ user_id (FK)            │
             │ credential_key (unique) │
             │ client_id               │
             │ client_secret           │
             └─────────────────────────┘
```

### 5.2 Enums
- **agent_type:** `task`, `orchestrator`, `connector`
- **agent_status:** `active`, `inactive`, `error`
- **workflow_status:** `draft`, `active`, `paused`, `archived`
- **source_type:** `file`, `url`, `api`, `manual`
- **kb_status:** `active`, `syncing`, `error`
- **integration_status:** `connected`, `disconnected`, `error`

### 5.3 Security
- **Row-Level Security (RLS):** Enabled on all tables
- **Policy:** Users can only access their own data
- **Triggers:** Auto-update `updated_at`, auto-create profile on signup

---

## 6. PROJECT STRUCTURE

```
orca/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # Backend API routes
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── tts/           # Text-to-speech
│   │   │   └── integrations/  # OAuth & credentials
│   │   ├── auth/callback/     # OAuth callback
│   │   ├── dashboard/         # Protected dashboard
│   │   └── login/             # Auth page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Sidebar, Header
│   │   ├── features/          # Dashboard sections
│   │   └── auth/              # Auth components
│   ├── lib/
│   │   ├── supabase/          # Auth & DB clients
│   │   └── integrations/      # API integrations
│   ├── stores/                # Zustand state
│   ├── hooks/                 # Custom hooks
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # SQL migrations
└── .claude/skills/            # Claude Code skills
```

---

## 7. API ROUTES

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Chat with GPT-4o + tool execution |
| `/api/tts` | POST | Text-to-speech synthesis |
| `/api/integrations/oauth/[provider]/authorize` | GET | Start OAuth flow |
| `/api/integrations/oauth/callback` | GET | Handle OAuth callback |
| `/api/integrations/credentials/[credentialKey]` | POST | Store credentials |
| `/auth/callback` | GET | Supabase auth callback |

---

## 8. DEVELOPMENT HISTORY

| Date | Commit | Description |
|------|--------|-------------|
| Latest | f7257e4 | Add free web browsing, maps search, chat with tool use |
| | 8220aef | Add provider setup modal with DB-stored OAuth credentials |
| | c40c345 | Redesign header and sidebar with premium UI |
| | 80254b7 | Upgrade typography to Inter font |
| | c5b4b62 | Update handover doc with OAuth integrations |
| | d50876c | Add OAuth API routes and integration UI |
| | 091614b | Fix dashboard to use Supabase Auth |
| | 2ea5425 | Setup Supabase auth, database schema, MCP |
| Initial | 6b0fa36 | Initial commit: Orca standalone platform |

---

## 9. ARCHITECTURE HIGHLIGHTS

### 9.1 Design Patterns
- **Client-Side SPA:** React dashboard with server API routes
- **Tool-Based Agentic AI:** GPT-4o with function calling
- **Credential Families:** Smart OAuth credential reuse (e.g., one Google credential for Drive, Docs, Gmail, Meet, Calendar)
- **Free API Strategy:** Maps and search use free APIs (OpenStreetMap, DuckDuckGo) to avoid costs

### 9.2 Security Measures
- Row-Level Security on all database tables
- CSRF protection with OAuth state tokens
- Middleware-protected dashboard routes
- Per-user credential isolation

### 9.3 Scalability Considerations
- Zustand for lightweight state management
- JSONB columns for flexible configuration
- Indexed foreign keys for query performance
- Modular component architecture

---

## 10. WHAT'S READY vs. NEEDS WORK

### Production-Ready
1. Authentication system (email + OAuth)
2. Chat interface with streaming + voice
3. AI tool execution (email, meetings, maps, browsing)
4. OAuth integration framework
5. Database schema with RLS
6. Premium UI with dark theme

### UI Shells (Backend Needed)
1. **Ingest Section:** File upload UI exists, needs processing backend
2. **Jobs Section:** Status UI exists, needs job queue system
3. **Knowledge Section:** Management UI exists, needs vector store integration
4. **Widget Config:** Customization UI exists, needs save/load logic
5. **Embed Section:** Code generator exists, needs widget runtime

### Not Started
1. Agent execution engine
2. Workflow orchestration
3. Multi-agent coordination
4. Knowledge base vector search
5. Document processing pipeline
6. Widget embedding runtime
7. Usage analytics/billing

---

## 11. RECOMMENDED NEXT STEPS

### Phase 1: Complete Core Features
1. Implement knowledge base ingestion pipeline
2. Add vector store (pgvector or Pinecone)
3. Build document processing for files/URLs
4. Connect knowledge to chat context

### Phase 2: Agent System
1. Design agent execution engine
2. Implement workflow steps runner
3. Add agent-to-agent communication
4. Build orchestrator agent type

### Phase 3: Widget & Embed
1. Create embeddable widget runtime
2. Add widget customization persistence
3. Generate embed codes
4. Build public widget endpoint

### Phase 4: Scaling & Production
1. Add usage metering
2. Implement rate limiting
3. Set up monitoring/logging
4. Deploy to production

---

## 12. ENVIRONMENT SETUP

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...  # Optional for OAuth
GOOGLE_CLIENT_SECRET=...
```

---

## 13. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | AI chat with tool calling |
| `src/lib/integrations/providers.ts` | OAuth provider registry |
| `src/lib/integrations/gmail.ts` | Gmail API integration |
| `src/lib/integrations/google-meet.ts` | Google Meet integration |
| `src/lib/integrations/google-maps.ts` | Maps integration (free APIs) |
| `src/lib/integrations/web-browse.ts` | Web search & scraping |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/stores/chat-store.ts` | Chat state management |
| `src/stores/app-store.ts` | Global app state |
| `src/components/features/new-task-section.tsx` | Chat interface |
| `src/components/features/connectors-section.tsx` | Integrations UI |
| `middleware.ts` | Auth route protection |
| `supabase/migrations/*.sql` | Database schema |

---

*This document provides a complete understanding of the Orca platform architecture, implemented features, and roadmap for future development.*
