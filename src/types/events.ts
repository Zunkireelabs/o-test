/**
 * Event types for Orca event ingestion system
 */

export interface EventInsert {
  event_type: string
  idempotency_key: string
  payload: Record<string, unknown>
}

export interface EventRecord extends EventInsert {
  id: string
  tenant_id: string
  project_id: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'
  chain_depth: number
  source_agent_id: string | null
  processing_started_at: string | null
  created_at: string
  processed_at: string | null
}

export interface IngestResponse {
  event_id: string
  status: 'accepted' | 'duplicate'
}

export interface IngestErrorResponse {
  error: string
}
