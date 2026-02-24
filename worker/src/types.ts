export interface EventRecord {
  id: string
  tenant_id: string
  project_id: string
  event_type: string
  source_agent_id: string | null
  payload: Record<string, unknown>
  status: string
  idempotency_key: string
  chain_depth: number
  processing_started_at: string | null
  created_at: string
  processed_at: string | null
  // Retry framework fields
  retry_count: number
  max_attempts: number
  error: string | null
  next_retry_at: string | null
}

export interface EmittedEvent {
  event_type: string
  payload: Record<string, unknown>
}

export interface Agent {
  name: string
  subscribe(): string[]
  handle(event: EventRecord): Promise<EmittedEvent[]>
}
