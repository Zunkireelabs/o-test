                    ┌──────────────────────────┐
                    │     Admin Dashboard      │
                    │       (Next.js)          │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      API Layer           │
                    │   (Next.js API Routes)   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │        ORCA CORE         │
                    │                          │
                    │  • Tenant Manager        │
                    │  • Project Manager       │
                    │  • Agent Registry        │
                    │  • Permission Engine     │
                    │  • Event Store           │
                    │  • Event Dispatcher      │
                    └────────────┬─────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
      ┌──────────────────┐             ┌──────────────────┐
      │ Background Worker│             │   Postgres DB     │
      │ (Execution Engine│             │  (Supabase)       │
      │ + Job Scheduler) │             │                  │
      └────────┬─────────┘             └──────────────────┘
               │
               ▼
      ┌──────────────────┐
      │   Agent Runtime  │
      │ (Internal Agents)│
      └──────────────────┘

External:
Zunkiree → Signed Webhook → Orca Event Ingestion API