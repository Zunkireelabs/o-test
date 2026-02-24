 Complete MCP + Skills Setup Guide for Project                                                                                    
                                                                                                                                           
  1. Supabase MCP Server Setup                                                                                                             
                                                                                                                                           
  What it is: The Supabase MCP server gives Claude Code direct access to your PostgreSQL database — it can run queries, inspect schema,
  list tables, etc. — all through the Model Context Protocol.

  File: .mcp.json (place in project root)

  {
    "mcpServers": {
      "supabase": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-supabase"],
        "env": {
          "SUPABASE_CONNECTION_STRING":
  "postgresql://postgres.<YOUR_PROJECT_REF>:<YOUR_PASSWORD>@aws-1-<YOUR_REGION>.pooler.supabase.com:5432/postgres"
        }
      }
    }
  }

  How to get your connection string:
  1. Go to Supabase Dashboard → your project → Settings → Database
  2. Copy the Connection string (URI) — use the pooler (Transaction mode) URL
  3. It looks like: postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

  Prerequisite: Node.js/npm must be installed (for npx).

  ---
  2. Enable the MCP Server in Claude Code Settings

  File: .claude/settings.local.json (in project root)

  {
    "permissions": {
      "allow": [
        "Bash(where:*)"
      ]
    },
    "enabledMcpjsonServers": [
      "supabase"
    ],
    "enableAllProjectMcpServers": true
  }

  Key fields:
  - "enabledMcpjsonServers": ["supabase"] — tells Claude Code to activate the supabase server defined in .mcp.json
  - "enableAllProjectMcpServers": true — auto-enable any MCP servers defined in the project

  ---
  3. The db-engineer Skill

  File: .claude/skills/db-engineer/SKILL.md

  ---
  name: db-engineer
  description: Database engineering for your project. PostgreSQL, Supabase, schema migrations, query optimization, data validation, tenant
  isolation. Use when running SQL, inspecting schema, writing migrations, validating data, or checking tenant isolation.
  ---

  # Database Engineer

  You are operating as the Database Engineer.

  ## Scope

  - PostgreSQL schema design and migrations
  - Supabase database operations
  - Query optimization and indexing
  - Data validation and integrity checks
  - Multi-tenant isolation (customer_id scoping)
  - Migration authoring in `backend/migrations/`

  ## Tool Routing

  - **psql** (via Bash): Quick queries, schema checks (`\d`, `\dt`), one-off migrations, data inspection
    - Connection: `source backend/.env && psql "$DATABASE_URL" -c "..."`
    - psql location: `/usr/bin/psql`
  - **Supabase MCP**: Structured exploration, multi-step operations, when MCP server is active

  ## Constraints

  - **No destructive operations without confirmation** — no DROP TABLE, TRUNCATE, or DELETE without explicit user approval
  - **Always filter by customer_id** — every data query must be tenant-scoped
  - **Read schema before DDL** — always inspect current table structure before ALTER/CREATE
  - **Document migrations** — all schema changes get a numbered SQL file in `backend/migrations/`
  - **Minimal changes** — execute the task, avoid unnecessary refactors

  ## Execution Rules

  1. Write clean, production-safe SQL
  2. Respect existing schema — do not restructure unless explicitly asked
  3. Use `IF NOT EXISTS` / `IF EXISTS` guards on DDL statements

  ---
  4. How It All Works Together

  ┌─────────────────────────────────────────────────┐
  │  Claude Code Session                            │
  │                                                 │
  │  1. Reads .mcp.json → finds "supabase" server   │
  │  2. Reads .claude/settings.local.json            │
  │     → confirms "supabase" is enabled             │
  │  3. Spawns: npx @modelcontextprotocol/server-supabase │
  │     with SUPABASE_CONNECTION_STRING env var       │
  │  4. MCP server connects to Supabase PostgreSQL   │
  │  5. Claude gets tools: query, list_tables,       │
  │     describe_table, etc.                         │
  │                                                  │
  │  When /db-engineer skill is invoked:             │
  │  → Claude reads .claude/skills/db-engineer/SKILL.md │
  │  → Gets persona + rules for DB operations        │
  │  → Uses MCP tools OR psql via Bash               │
  └─────────────────────────────────────────────────┘

  Two paths to the database:
  1. Supabase MCP — Claude uses it as a structured tool (list tables, run queries via MCP protocol)
  2. psql via Bash — Direct CLI, used for quick \d checks or one-liners. Requires DATABASE_URL in backend/.env

  ---
  5. Step-by-Step Setup for Your Other Project

  # 1. Create the MCP config
  cat > /path/to/your-project/.mcp.json << 'EOF'
  {
    "mcpServers": {
      "supabase": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-supabase"],
        "env": {
          "SUPABASE_CONNECTION_STRING": "YOUR_CONNECTION_STRING_HERE"
        }
      }
    }
  }
  EOF

  # 2. Create Claude settings
  mkdir -p /path/to/your-project/.claude
  cat > /path/to/your-project/.claude/settings.local.json << 'EOF'
  {
    "permissions": {
      "allow": []
    },
    "enabledMcpjsonServers": [
      "supabase"
    ],
    "enableAllProjectMcpServers": true
  }
  EOF

  # 3. Create the db-engineer skill
  mkdir -p /path/to/your-project/.claude/skills/db-engineer
  # Then create SKILL.md with the content from section 3 above

  # 4. Restart Claude Code (or start a new session)
  # The MCP server auto-starts when Claude Code launches

  ---
  6. Gotchas & Notes

  - .mcp.json goes in the project root, not inside .claude/
  - The MCP server spawns automatically when you start a Claude Code session — no manual start needed
  - The npx -y flag auto-installs @modelcontextprotocol/server-supabase on first run
  - Security: The .mcp.json contains your DB connection string. Add it to .gitignore if this is a shared repo
  - Skills are auto-detected by Claude Code from the .claude/skills/*/SKILL.md path pattern — the frontmatter (name, description) is what
  Claude uses to decide when to activate the skill
  - You can also use psql directly as a fallback — the skill's "Tool Routing" section tells Claude when to use MCP vs psql