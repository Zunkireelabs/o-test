-- Migration: 005_email_logs
-- Description: Create email_logs table for email.sent event projection

-- Create email_logs table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL,
  lead_id uuid,
  email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  event_id uuid NOT NULL,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_email_logs_tenant_id ON public.email_logs(tenant_id);
CREATE INDEX idx_email_logs_project_id ON public.email_logs(project_id);
CREATE INDEX idx_email_logs_email ON public.email_logs(email);
CREATE INDEX idx_email_logs_event_id ON public.email_logs(event_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Enable Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view email logs"
ON public.email_logs
FOR SELECT
USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (is_tenant_member(tenant_id));
