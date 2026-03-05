import { getSupabaseClient } from '../db'
import type { EventRecord } from '../types'

/**
 * Lead Projection
 *
 * Handles lead persistence events from CRM connector agent and webhooks.
 * This is the ONLY place where leads are written to the database.
 *
 * ARCHITECTURAL INVARIANT:
 * - Projections ONLY perform deterministic DB writes
 * - Projections NEVER call external APIs
 * - Projections NEVER emit business logic events
 * - Projections MUST be idempotent
 *
 * Subscribes to:
 * - lead.persist (legacy - from CrmLeadAgent)
 * - lead.persist_requested (new - from CrmConnectorAgent)
 */

export async function runLeadProjection(event: EventRecord): Promise<void> {
  // Handle both legacy and new event types
  if (event.event_type === 'lead.persist') {
    return handleLegacyPersist(event)
  }

  if (event.event_type === 'lead.persist_requested') {
    return handlePersistRequested(event)
  }

  // Not a lead projection event
  return
}

/**
 * Handle new lead.persist_requested events from CrmConnectorAgent
 *
 * NEW SCHEMA (reference-only table):
 * - Orca does NOT mirror CRM fields locally
 * - Only stores provider + external_id as external reference
 * - Uses UPSERT on (provider, external_id, tenant_id)
 */
async function handlePersistRequested(event: EventRecord): Promise<void> {
  const payload = event.payload as {
    tenant_id: string
    project_id: string
    provider: string
    external_id: string
    last_action?: string
    linked_session_id?: string | null
    linked_workflow_id?: string | null
    metadata?: Record<string, unknown> | null
  }

  if (!payload.external_id) {
    console.log(`[LeadProjection] Skipping lead.persist_requested: missing external_id`)
    return
  }

  if (!payload.provider) {
    console.log(`[LeadProjection] Skipping lead.persist_requested: missing provider`)
    return
  }

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  // Idempotent UPSERT using (provider, external_id, tenant_id) as composite key
  // ON CONFLICT → update last_action, last_synced_at, metadata, updated_at
  const { error } = await supabase
    .from('leads')
    .upsert(
      {
        tenant_id: payload.tenant_id || event.tenant_id,
        project_id: payload.project_id || event.project_id,
        provider: payload.provider,
        external_id: payload.external_id,
        linked_session_id: payload.linked_session_id || null,
        linked_workflow_id: payload.linked_workflow_id || null,
        last_action: payload.last_action || null,
        last_synced_at: now,
        metadata: payload.metadata || null,
        updated_at: now,
      },
      {
        onConflict: 'provider,external_id,tenant_id',
        ignoreDuplicates: false, // Update on conflict
      }
    )

  if (error) {
    // Handle unique constraint violation gracefully (idempotency)
    if (error.code === '23505') {
      console.log(`[LeadProjection] Lead reference already exists (idempotent): ${payload.provider}/${payload.external_id}`)
      return
    }
    console.error(`[LeadProjection] Error upserting lead reference:`, error)
    throw error
  }

  console.log(`[LeadProjection] Upserted lead reference: ${payload.provider}/${payload.external_id} (action: ${payload.last_action || 'none'})`)
}

/**
 * Handle legacy lead.persist events from CrmLeadAgent
 *
 * DEPRECATED: This handler exists for backwards compatibility only.
 * New code should emit lead.persist_requested with the new schema.
 *
 * The legacy event format used email as the primary key, but the new schema
 * uses (provider, external_id, tenant_id). For legacy events, we'll use
 * 'legacy' as provider and generate an external_id from the email hash.
 */
async function handleLegacyPersist(event: EventRecord): Promise<void> {
  const payload = event.payload as {
    email?: string
    name?: string | null
    company?: string | null
    source_event_id?: string
  }

  if (!payload.email) {
    console.log(`[LeadProjection] Skipping lead.persist: missing email`)
    return
  }

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  // For legacy events, use 'legacy' as provider and email as external_id
  const provider = 'legacy'
  const externalId = payload.email

  // Idempotent UPSERT using new schema
  const { error } = await supabase
    .from('leads')
    .upsert(
      {
        tenant_id: event.tenant_id,
        project_id: event.project_id,
        provider,
        external_id: externalId,
        last_action: 'legacy_persist',
        last_synced_at: now,
        metadata: {
          email: payload.email,
          name: payload.name,
          company: payload.company,
          source_event_id: payload.source_event_id,
          migrated_from_legacy: true,
        },
        updated_at: now,
      },
      {
        onConflict: 'provider,external_id,tenant_id',
        ignoreDuplicates: false,
      }
    )

  if (error) {
    if (error.code === '23505') {
      console.log(`[LeadProjection] Lead reference already exists (legacy idempotent): ${provider}/${externalId}`)
      return
    }
    console.error(`[LeadProjection] Error upserting lead reference (legacy):`, error)
    throw error
  }

  console.log(`[LeadProjection] Upserted lead reference (legacy): ${provider}/${externalId}`)
}
