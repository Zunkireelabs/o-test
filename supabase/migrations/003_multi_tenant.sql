-- ============================================
-- Orca Multi-Tenant Architecture Migration
-- Phase 1: Foundation Schema
-- ============================================

-- ============================================
-- 1. TENANTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  hmac_secret TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- ============================================
-- 2. TENANT_USERS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);

-- ============================================
-- 3. PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);

-- ============================================
-- 4. EVENT_STORE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_agent_id UUID NULL,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')) DEFAULT 'pending',
  idempotency_key TEXT NOT NULL,
  chain_depth INTEGER DEFAULT 0,
  processing_started_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL,
  UNIQUE(tenant_id, idempotency_key)
);

CREATE INDEX idx_event_store_tenant_status ON public.event_store(tenant_id, status);
CREATE INDEX idx_event_store_project_id ON public.event_store(project_id);
CREATE INDEX idx_event_store_processing_started_at ON public.event_store(processing_started_at);

-- ============================================
-- 5. AGENT_SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_subscriptions_tenant_event ON public.agent_subscriptions(tenant_id, event_type);

-- ============================================
-- 6. LEADS (CRM Projection Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new',
  event_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant_email ON public.leads(tenant_id, email);
CREATE INDEX idx_leads_project_id ON public.leads(project_id);

-- ============================================
-- 7. ADD TENANT/PROJECT COLUMNS TO EXISTING TABLES
-- ============================================

-- Agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_tenant_id ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_project_id ON public.agents(project_id);

-- Workflows
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows(project_id);

-- Knowledge Bases
ALTER TABLE public.knowledge_bases
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_bases_tenant_id ON public.knowledge_bases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_project_id ON public.knowledge_bases(project_id);

-- Integrations
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON public.integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_project_id ON public.integrations(project_id);

-- ============================================
-- 8. BACKFILL: CREATE TENANTS/PROJECTS FOR EXISTING USERS
-- ============================================

-- Create tenants for existing users
INSERT INTO public.tenants (id, name, slug, hmac_secret, config)
SELECT
  gen_random_uuid(),
  COALESCE(p.name, split_part(p.email, '@', 1)) || '''s Workspace',
  LOWER(REGEXP_REPLACE(COALESCE(p.name, split_part(p.email, '@', 1)), '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(p.id::text, 1, 8),
  encode(gen_random_bytes(32), 'hex'),
  '{}'::jsonb
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = p.id
);

-- Create tenant_users for each user as owner of their tenant
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT
  t.id,
  p.id,
  'owner'
FROM public.profiles p
CROSS JOIN LATERAL (
  SELECT id FROM public.tenants
  WHERE slug LIKE '%' || SUBSTRING(p.id::text, 1, 8)
  LIMIT 1
) t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = p.id
);

-- Create default project for each tenant
INSERT INTO public.projects (id, tenant_id, name, type, status)
SELECT
  gen_random_uuid(),
  t.id,
  'Default Project',
  'general',
  'active'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.projects p WHERE p.tenant_id = t.id
);

-- Update existing agents with tenant_id and project_id
UPDATE public.agents a
SET
  tenant_id = tu.tenant_id,
  project_id = (SELECT p.id FROM public.projects p WHERE p.tenant_id = tu.tenant_id LIMIT 1)
FROM public.tenant_users tu
WHERE a.user_id = tu.user_id
  AND a.tenant_id IS NULL;

-- Update existing workflows with tenant_id and project_id
UPDATE public.workflows w
SET
  tenant_id = tu.tenant_id,
  project_id = (SELECT p.id FROM public.projects p WHERE p.tenant_id = tu.tenant_id LIMIT 1)
FROM public.tenant_users tu
WHERE w.user_id = tu.user_id
  AND w.tenant_id IS NULL;

-- Update existing knowledge_bases with tenant_id and project_id
UPDATE public.knowledge_bases kb
SET
  tenant_id = tu.tenant_id,
  project_id = (SELECT p.id FROM public.projects p WHERE p.tenant_id = tu.tenant_id LIMIT 1)
FROM public.tenant_users tu
WHERE kb.user_id = tu.user_id
  AND kb.tenant_id IS NULL;

-- Update existing integrations with tenant_id and project_id
UPDATE public.integrations i
SET
  tenant_id = tu.tenant_id,
  project_id = (SELECT p.id FROM public.projects p WHERE p.tenant_id = tu.tenant_id LIMIT 1)
FROM public.tenant_users tu
WHERE i.user_id = tu.user_id
  AND i.tenant_id IS NULL;

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = check_tenant_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: users can view tenants they belong to
CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (is_tenant_member(id));

CREATE POLICY "Users can update own tenants" ON public.tenants
  FOR UPDATE USING (is_tenant_member(id));

-- Tenant Users: members can view, owners can manage
CREATE POLICY "Members can view tenant users" ON public.tenant_users
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Owners can insert tenant users" ON public.tenant_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role = 'owner'
    )
  );

CREATE POLICY "Owners can update tenant users" ON public.tenant_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete tenant users" ON public.tenant_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role = 'owner'
    )
  );

-- Projects: tenant members can access
CREATE POLICY "Members can view projects" ON public.projects
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can create projects" ON public.projects
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update projects" ON public.projects
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can delete projects" ON public.projects
  FOR DELETE USING (is_tenant_member(tenant_id));

-- Event Store: tenant members can view
CREATE POLICY "Members can view events" ON public.event_store
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert events" ON public.event_store
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

-- Agent Subscriptions: tenant members can manage
CREATE POLICY "Members can view subscriptions" ON public.agent_subscriptions
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can create subscriptions" ON public.agent_subscriptions
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update subscriptions" ON public.agent_subscriptions
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can delete subscriptions" ON public.agent_subscriptions
  FOR DELETE USING (is_tenant_member(tenant_id));

-- Leads: tenant members can manage
CREATE POLICY "Members can view leads" ON public.leads
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can create leads" ON public.leads
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update leads" ON public.leads
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can delete leads" ON public.leads
  FOR DELETE USING (is_tenant_member(tenant_id));

-- ============================================
-- 10. UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
