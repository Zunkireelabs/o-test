# ORCA_MASTER_ROADMAP.md
## Orca — Event-Driven AI Orchestration Platform
### CTO-Level Strategic Plan (Phase 1 → Phase 4)

---

# 🧭 Executive Summary

Orca is an event-driven AI orchestration engine built on:

- GPT tool-forced domain events
- Event sourcing architecture
- Background worker processing
- Agent registry system
- Projection layer
- Strict multi-tenant isolation (tenant_id + project_id)

Orca is not:
> “AI that sends emails”

Orca is:
> “AI Orchestration Engine for Business Systems”

This roadmap reflects **actual current progress** and defines the correct forward path.

---

# 🔹 PHASE 1 — Core Event Engine (✅ COMPLETE)

## Objective:
Build deterministic AI orchestration backbone.

---

## 1️⃣ Chat Layer

- GPT tool forcing (`emit_event`)
- Intent detection boundary
- Argument normalization
- Streaming handling
- Deterministic tool execution
- Email intent forcing
- Server-side idempotency generation

Status: ✅ Verified end-to-end

---

## 2️⃣ Event Store

Table: `event_store`

Includes:

- id
- tenant_id
- project_id
- event_type
- payload
- status (pending, completed, failed)
- chain_depth
- idempotency_key
- processing_started_at
- processed_at

Status: ✅ Multi-tenant safe  
Status: ✅ Deterministic

---

## 3️⃣ Background Worker

- Polls every 1s
- Claims pending events
- Executes matching agents
- Emits child events
- Updates event status

Status: ✅ Verified  
Status: ✅ End-to-end tested

---

## 4️⃣ Agent System

Registry-based architecture:

- CrmLeadAgent
- EmailBroadcastAgent

Agents:

- Subscribe by event_type
- Return emitted events
- Do not mutate DB directly

Status: ✅ Stable

---

## 5️⃣ Projection Layer

- `email_logs` table
- runEmailProjection()
- Deterministic insert from `email.sent`

Status: ✅ Working

---

## 🔁 Verified Flow

User  
→ Chat Layer  
→ emit_event  
→ event_store  
→ Worker  
→ Agent  
→ Emit child events  
→ Projection  
→ Status update  

Fully async. Fully event-driven.

---

# 🔹 PHASE 2 — Production Hardening (🟡 80% COMPLETE)

## Objective:
Make Orca safe for real-world SaaS usage.

---

## 2.1 Retry & Failure Framework (✅ COMPLETE)

Added:

- retry_count
- max_attempts
- error
- next_retry_at
- Exponential backoff (2^retry_count)
- Permanent failure state

Validated:

- Forced failure
- Backoff sequence
- Final failed status
- processed_at updated
- Error persisted

Status: ✅ Production safe

---

## 2.2 Idempotency Hardening (✅ COMPLETE)

Protections:

- UNIQUE (tenant_id, idempotency_key)
- Deterministic child idempotency keys
- Upsert with conflict ignore
- Worker safe reprocessing guard
- GPT cannot override idempotency

Protects against:

- GPT double emission
- Worker restart replay
- Network retry duplication
- Child event duplication

Status: ✅ Hardened

---

## 2.3 Worker Production Deployment (⬜ PENDING)

Current:
- Worker runs locally

Required:
- Deploy worker to VPS
- Use SERVICE_ROLE key
- Ensure persistent background execution
- Add restart policy
- Structured logs
- Optional health endpoint

Status: ⬜ Next Immediate Step

---

## 2.4 Observability Dashboard (⬜ PENDING)

Admin-only UI:

- View event_store
- Filter by tenant
- Filter by status
- View retry_count
- View error logs
- Inspect event chains

Reason:
Event-driven systems cannot operate blind.

Status: ⬜ After Worker Deployment

---

# 🔹 PHASE 3 — Multi-Tenant SaaS Activation

## Objective:
Enable real user onboarding safely.

---

## 3.1 Tenant Onboarding Flow

Build:

- Signup
- Tenant creation
- Default project auto-create
- Role assignment
- API key generation

---

## 3.2 Role-Based Access Control

Roles:

- owner
- admin
- member

Enforce:

- RLS isolation
- No cross-tenant access
- Project-level scoping

---

## 3.3 Billing Readiness (Even If Free Initially)

Add:

- plan column
- usage tracking
- rate limit enforcement
- feature gating structure

Prepare for:

- Subscription
- Usage-based billing

---

## 3.4 Integration Management UI

Allow users to:

- Connect Gmail (OAuth)
- Connect CRM
- Manage API keys
- Enable/disable agents

---

# 🔹 PHASE 4 — CRM Productionization + Private Beta (Admizz)

## Objective:
Controlled real-client deployment.

---

## 4.1 CRM Agent Hardening

- CRUD validation
- Tenant-bound credentials
- Audit logging
- Permission enforcement
- Operation validation

---

## 4.2 Gmail API Integration

Replace simulated email with:

- OAuth2 Gmail
- Token refresh
- Real send API
- Failure capture into event_store

---

## 4.3 Admizz Private Beta

Admizz becomes:

> Design Partner Tenant

Controlled feature rollout:

- Email broadcast
- Lead CRUD
- CRM sync
- Workflow triggers

Monitor:

- Event throughput
- Retry behavior
- Performance
- Edge cases

---

# 🏗 Final Architecture (Target State)

User  
→ Chat Layer (Vercel)  
→ Event Store (Supabase)  
→ Worker (VPS)  
→ Agents  
→ Emit Events  
→ Projections  
→ Admin Dashboard  

Fully async. Multi-tenant safe. Idempotent. Retry-protected.

---

# 📆 Updated Timeline

Week 1 (Current):
- Retry framework
- Idempotency hardening
- Worker VPS deployment

Week 2:
- Observability dashboard
- Tenant onboarding

Week 3:
- RBAC enforcement
- Integration management

Week 4:
- Gmail API
- CRM productionization
- Admizz private beta

---

# 🚀 When Can New Users Sign Up?

After:

- Worker deployed
- Observability built
- RLS audited

Estimated:
~2–3 weeks from now.

---

# ⚠️ Risk Areas To Monitor

- Cross-tenant bleed
- Duplicate emissions
- Worker crash loops
- Long-running agent blocking
- Token expiration
- Throughput scaling

---

# 🧠 CTO Positioning

Do NOT rush CRM for one client.
Stabilize engine.
Deploy worker.
Build observability.
Then onboard.

Protect reputation.
Build foundation.

---

# ✅ Current Status Snapshot

Phase 1: ✅ Complete  
Phase 2: 🟡 80% Complete  
Phase 3: ⬜ Not Started  
Phase 4: ⬜ Planned  

---

# 🎯 Next Immediate Action

Deploy Worker to VPS (Phase 2.3)

Then build Observability Dashboard.