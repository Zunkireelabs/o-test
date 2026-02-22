-- Provider credentials table: stores OAuth app credentials per user + provider family
CREATE TABLE public.provider_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_key TEXT NOT NULL,  -- 'google', 'atlassian', 'github', etc.
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, credential_key)
);

-- Enable RLS
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

-- Users can read their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.provider_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
  ON public.provider_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.provider_credentials FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON public.provider_credentials FOR DELETE
  USING (auth.uid() = user_id);
