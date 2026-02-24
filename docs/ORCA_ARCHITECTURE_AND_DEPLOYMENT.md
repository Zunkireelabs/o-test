# ORCA_ARCHITECTURE_AND_DEPLOYMENT.md
## Complete System Architecture, Deployment Model & Team Workflow
### Source of Truth Reference Document

---

# 🧭 Purpose of This Document

This document defines:

- System architecture
- Deployment topology
- Branching strategy
- Worker sync model
- Production safety rules
- Developer workflow
- Future scaling direction

If confusion happens — refer to this file.

---

# 🏗 1. ORCA SYSTEM ARCHITECTURE

Orca is an **event-driven AI orchestration platform**.

It is NOT a synchronous API system.

It operates on:

- GPT tool-forced domain events
- Event store
- Background worker processing
- Agent registry system
- Projection layer
- Multi-tenant isolation

---

# 🧠 High-Level Architecture

```
User
  │
  ▼
Next.js App (Vercel)
  │
  ▼
emit_event → event_store (Supabase)
  │
  ▼
Background Worker (VPS)
  │
  ▼
Agents
  │
  ▼
Child Events
  │
  ▼
Projections
```

---

# 🧱 Infrastructure Components

## 1️⃣ Frontend (Next.js)

- Hosted on Vercel
- Live URL: https://orca.zunkireelabs.com
- Auto-deploys from `main` branch only
- Stateless
- Uses Supabase

---

## 2️⃣ Database (Supabase)

Core tables:

- event_store
- email_logs
- leads
- tenants
- projects

Features:

- RLS enforced
- Multi-tenant isolation
- Idempotency constraints
- Retry framework columns

Supabase is the **durable system of record**.

---

## 3️⃣ Background Worker (VPS)

Runs on:

- Ubuntu 22.04 VPS
- Node.js
- PM2 process manager

Responsibilities:

- Poll event_store
- Claim pending events
- Execute agents
- Insert child events
- Handle retry logic
- Enforce idempotency
- Update status

Worker is:

- Always-on
- Stateful processor
- Manual deployment controlled

---

## 4️⃣ Source Control (GitHub)

Single monorepo:

```
/orca
├── src/        (Next.js)
├── worker/     (Background worker)
├── supabase/   (Migrations)
└── docs/
```

Branches:

- dev → development
- main → production

GitHub is the **single source of truth**.

---

# 🔁 2. COMPLETE DEVELOPMENT WORKFLOW

---

# 🖥 LOCAL DEVELOPMENT FLOW

### Step 1 — Work on dev branch

```
git checkout dev
```

### Step 2 — Implement feature
- Update frontend
- Update worker (if needed)
- Update migrations (if needed)

### Step 3 — Test locally

- Run Next.js locally
- Run worker locally
- Test event flow

### Step 4 — Commit to dev

```
git add .
git commit -m "Feature: X"
git push origin dev
```

At this stage:

- Vercel is NOT updated
- VPS is NOT updated
- Production untouched

---

# 🚀 PRODUCTION RELEASE FLOW

When feature is stable:

```
git checkout main
git merge dev
git push origin main
```

Now:

### 🔹 Vercel auto-deploys main
orca.zunkireelabs.com updates automatically.

### 🔹 Worker DOES NOT auto-update

You must update VPS manually.

---

# 🔁 WORKER SYNC PROCEDURE (PRODUCTION)

On VPS:

```
cd ~/orca-worker
git pull origin main
pm2 restart orca-worker
```

Worker now matches production frontend.

---

# 📊 VISUAL DEPLOYMENT FLOW

```
LOCAL MACHINE
   │
   ▼
git push dev
   │
   ▼
GitHub (dev)
   │
   ▼
Test & Validate
   │
   ▼
git merge dev → main
git push origin main
   │
   ├──► Vercel auto deploys
   │
   └──► VPS:
            git pull main
            pm2 restart
```

---

# 🏗 FULL INFRASTRUCTURE DIAGRAM

```
                Developers (Local)
                        │
                        ▼
                ┌────────────────┐
                │    GitHub      │
                │ dev   | main   │
                └────────┬───────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
   ┌───────────────┐            ┌────────────────┐
   │    Vercel     │            │      VPS       │
   │ Next.js App   │            │  Worker (PM2)  │
   │ (main only)   │            │                │
   └───────┬───────┘            └───────┬────────┘
           │                            │
           └──────────────┬─────────────┘
                          ▼
                   ┌───────────────┐
                   │   Supabase    │
                   │ event_store   │
                   └───────────────┘
```

---

# 🛡 PRODUCTION SAFETY RULES

### Rule 1
Never push directly to main without testing in dev.

### Rule 2
Worker must always run same branch as frontend.

### Rule 3
Apply DB migrations before frontend relies on them.

### Rule 4
Never deploy worker from dev branch to production VPS.

### Rule 5
Restart worker after every production pull.

---

# 🔄 HOW WORKER UPDATES WORK

When worker changes:

1. Develop locally
2. Push to dev
3. Merge dev → main
4. Push main
5. SSH VPS
6. git pull main
7. pm2 restart worker

Manual control = safe control.

---

# 📦 ENVIRONMENT SEPARATION

Frontend (Vercel):

- NEXT_PUBLIC_SUPABASE_URL
- ANON KEY

Worker (VPS):

- SUPABASE_URL
- SERVICE_ROLE_KEY

Service role NEVER exposed to frontend.

---

# 🔐 IDENTITY & SECURITY MODEL

Frontend:
- Auth via Supabase
- RLS enforced

Worker:
- Uses service role
- Enforces tenant_id + project_id in logic

Database:
- RLS policies
- Unique idempotency constraints
- Retry framework

---

# 📆 RELEASE MODEL SUMMARY

| Stage | Branch | Deployment Target |
|--------|--------|------------------|
| Development | dev | Local only |
| Testing | dev | Local |
| Production | main | Vercel + VPS |
| Database | migration files | Supabase |

---

# 🧠 FUTURE IMPROVEMENTS (PHASE 4+)

- CI/CD auto-deploy worker
- Staging environment
- Blue/Green worker
- Horizontal scaling
- Queue-based worker model
- Monitoring dashboard
- Alerting system

---

# 🧭 WHO SHOULD READ THIS

- CTO
- Backend engineers
- DevOps
- AI integration engineers
- Anyone touching worker or deployment

---

# 🎯 FINAL PRINCIPLE

Orca is:

An event-driven orchestration engine.

Frontend is stateless.
Worker is deterministic processor.
Supabase is durable source of truth.
GitHub is authority.
Main branch is production.

Stability over speed.
Correctness over convenience.

---

END OF DOCUMENT