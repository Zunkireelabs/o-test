-- ============================================
-- Orca Phase 2: Retry Framework Migration
-- Adds retry/failure handling columns to event_store
-- ============================================

-- ============================================
-- 1. ADD RETRY COLUMNS TO EVENT_STORE
-- ============================================

-- retry_count: tracks number of retry attempts
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- max_attempts: configurable max retries per event
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3;

-- error: stores error message/stack trace on failure
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS error TEXT NULL;

-- next_retry_at: scheduled time for next retry attempt
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ NULL;

-- ============================================
-- 2. ADD INDEXES FOR WORKER POLLING
-- ============================================

-- Index on status for filtering events by state
-- Note: There's already idx_event_store_tenant_status on (tenant_id, status)
-- This standalone index helps queries that filter only by status
CREATE INDEX IF NOT EXISTS idx_event_store_status
  ON public.event_store(status);

-- Index on next_retry_at for retry scheduling queries
CREATE INDEX IF NOT EXISTS idx_event_store_next_retry_at
  ON public.event_store(next_retry_at);

-- Composite index for efficient retry polling:
-- Worker query: WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW())
CREATE INDEX IF NOT EXISTS idx_event_store_retry_polling
  ON public.event_store(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

-- ============================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.event_store.retry_count IS
  'Number of processing attempts made for this event';

COMMENT ON COLUMN public.event_store.max_attempts IS
  'Maximum number of retry attempts before moving to dead_letter';

COMMENT ON COLUMN public.event_store.error IS
  'Error message or stack trace from the last failed attempt';

COMMENT ON COLUMN public.event_store.next_retry_at IS
  'Scheduled timestamp for next retry attempt (exponential backoff)';
