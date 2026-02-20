---
name: orca-db
description: Database operations for Orca. Intelligently chooses between MCP (direct SQL) and Supabase client based on the task. Saves tokens by using the most efficient approach.
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Orca Database Operations

Smart database operations that choose the right tool for the job.

## Decision Matrix

Use this matrix to decide which approach to use:

| Task | Use MCP (Direct SQL) | Use Supabase Client |
|------|---------------------|---------------------|
| Quick data inspection | ✅ | |
| Schema exploration | ✅ | |
| Run migrations | ✅ | |
| Complex joins/queries | ✅ | |
| Debug data issues | ✅ | |
| Bulk data operations | ✅ | |
| Auth operations | | ✅ |
| Real-time subscriptions | | ✅ |
| Client-side CRUD | | ✅ |
| RLS-aware queries | | ✅ |
| File uploads (storage) | | ✅ |

## MCP Servers Available

### 1. PostgreSQL MCP (`postgres`)
Direct SQL access to the database.

```bash
# The MCP is configured in .mcp.json
# Uses DATABASE_URL from environment
```

**When to use:**
- Running raw SQL queries
- Schema inspection
- Data debugging
- Migrations
- Complex analytical queries

### 2. Supabase PostgREST MCP (`supabase`)
REST API access with automatic typing.

**When to use:**
- Standard CRUD operations
- When you need PostgREST features
- API-style data access

## Quick Commands

### Inspect Schema
```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Describe a table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'agents';

-- List all enums
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;
```

### Common Queries
```sql
-- Count users
SELECT COUNT(*) FROM profiles;

-- Recent agents
SELECT * FROM agents ORDER BY created_at DESC LIMIT 10;

-- Active workflows
SELECT * FROM workflows WHERE status = 'active';

-- User's resources
SELECT
  (SELECT COUNT(*) FROM agents WHERE user_id = p.id) as agents,
  (SELECT COUNT(*) FROM workflows WHERE user_id = p.id) as workflows,
  (SELECT COUNT(*) FROM knowledge_bases WHERE user_id = p.id) as knowledge_bases
FROM profiles p WHERE p.id = 'USER_ID';
```

### Migrations
```bash
# Run migration via MCP
# Copy SQL from supabase/migrations/XXX.sql and execute via postgres MCP

# Or via Supabase CLI
npx supabase db push
```

## Supabase Client Usage

### Server-side (API routes, Server Components)
```typescript
import { createClient } from '@/lib/supabase/server';

export async function getAgents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Client-side (React Components)
```typescript
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

// CRUD operations
const { data } = await supabase.from('agents').select('*');
await supabase.from('agents').insert({ name: 'New Agent', type: 'task' });
await supabase.from('agents').update({ status: 'active' }).eq('id', agentId);
await supabase.from('agents').delete().eq('id', agentId);
```

### Auth Operations (Always use Supabase client)
```typescript
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx  # Server-side only
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

## File Locations

- **Schema types**: `src/types/database.ts`
- **Client (browser)**: `src/lib/supabase/client.ts`
- **Client (server)**: `src/lib/supabase/server.ts`
- **Middleware**: `middleware.ts`
- **Migrations**: `supabase/migrations/`
- **MCP config**: `.mcp.json`

## Token-Saving Tips

1. **Use MCP for exploration** - Don't write code to inspect data, just query directly
2. **Use MCP for debugging** - Quick SQL beats writing debug code
3. **Use client for auth** - Auth flows need proper cookie/session handling
4. **Batch operations via MCP** - Complex multi-table operations are faster as SQL
5. **Schema changes via MCP** - Direct DDL is cleaner than migration scripts for quick changes
