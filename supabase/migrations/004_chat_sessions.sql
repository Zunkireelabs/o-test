-- Migration: 004_chat_sessions
-- Description: Create chat_sessions and chat_messages tables for persistent multi-session chat
-- Multi-tenant, project-scoped, RLS enforced

-- ============================================================================
-- CHAT SESSIONS TABLE
-- ============================================================================

CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for chat_sessions
CREATE INDEX idx_chat_sessions_tenant_id ON chat_sessions(tenant_id);
CREATE INDEX idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: User can access sessions where they are a member of the tenant
CREATE POLICY "Users can view their tenant's chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat sessions in their tenant"
  ON chat_sessions
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CHAT MESSAGES TABLE
-- ============================================================================

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content text NOT NULL,
  tool_calls jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for chat_messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: User can access messages if the session belongs to their tenant
CREATE POLICY "Users can view messages in their tenant's sessions"
  ON chat_messages
  FOR SELECT
  USING (
    session_id IN (
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages in their tenant's sessions"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update messages in their own sessions"
  ON chat_messages
  FOR UPDATE
  USING (
    session_id IN (
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.user_id = auth.uid()
      AND cs.tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete messages in their own sessions"
  ON chat_messages
  FOR DELETE
  USING (
    session_id IN (
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.user_id = auth.uid()
      AND cs.tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TRIGGER: Auto-update updated_at on chat_sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

-- ============================================================================
-- TRIGGER: Update session updated_at when message is added
-- ============================================================================

CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_message_updates_session
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_message();
