import { v4 as uuidv4 } from 'uuid'
import { getSupabaseClient } from './db'
import { getAgentsForEvent } from './registry'
import { runProjections } from './projections'
import type { EventRecord, EmittedEvent } from './types'

const MAX_CHAIN_DEPTH = 5
const STUCK_THRESHOLD_MINUTES = 2

// Column selection for event queries
const EVENT_COLUMNS = 'id, tenant_id, project_id, event_type, payload, chain_depth, idempotency_key, status, source_agent_id, processing_started_at, created_at, processed_at, retry_count, max_attempts, error, next_retry_at'

export class EventProcessor {
  async run(): Promise<void> {
    await this.recoverStuckEvents()

    const events = await this.fetchPendingEvents(10)

    if (events.length === 0) {
      return
    }

    console.log(`[Processor] Found ${events.length} pending event(s)`)

    for (const event of events) {
      const claimed = await this.claimEvent(event.id)

      if (!claimed) {
        console.log(`[Processor] Event ${event.id} already claimed by another worker`)
        continue
      }

      await this.processEvent(claimed)
    }
  }

  async recoverStuckEvents(): Promise<void> {
    const supabase = getSupabaseClient()

    const cutoffTime = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString()

    // Recover stuck events - they will be retried with their current retry_count
    // The next processing attempt will increment retry_count if it fails
    const { data: updated, error: updateError } = await supabase
      .from('event_store')
      .update({
        status: 'pending',
        processing_started_at: null,
        next_retry_at: null // Allow immediate retry
      })
      .eq('status', 'processing')
      .lt('processing_started_at', cutoffTime)
      .select('id, retry_count')

    if (updateError) {
      console.error('[Processor] Error recovering stuck events:', updateError)
      return
    }

    if (updated && updated.length > 0) {
      console.log(`[Processor] ♻️ Recovered ${updated.length} stuck event(s)`)
      for (const event of updated) {
        console.log(`[Processor]    - Event ${event.id} (retry_count: ${event.retry_count})`)
      }
    }
  }

  async fetchPendingEvents(limit: number): Promise<EventRecord[]> {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    // Fetch pending events that are ready for processing
    // Either no retry scheduled (new events) or retry time has passed
    const { data, error } = await supabase
      .from('event_store')
      .select(EVENT_COLUMNS)
      .eq('status', 'pending')
      .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[Processor] Error fetching pending events:', error)
      return []
    }

    return (data || []) as EventRecord[]
  }

  async claimEvent(eventId: string): Promise<EventRecord | null> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('event_store')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('status', 'pending')
      .select(EVENT_COLUMNS)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[Processor] Error claiming event:', error)
      return null
    }

    const retryInfo = data.retry_count > 0 ? ` [retry ${data.retry_count}/${data.max_attempts}]` : ''
    console.log(`[Processor] Claimed event: ${eventId} (type: ${data.event_type})${retryInfo}`)
    return data as EventRecord
  }

  async processEvent(event: EventRecord): Promise<void> {
    const chainDepth = event.chain_depth ?? 0

    // Check chain depth limit (non-retryable failure)
    if (chainDepth >= MAX_CHAIN_DEPTH) {
      console.log(`[Processor] Event ${event.id} exceeded max chain depth (${chainDepth}/${MAX_CHAIN_DEPTH})`)
      await this.markEventPermanentlyFailed(event, 'Max chain depth exceeded')
      return
    }

    const agents = getAgentsForEvent(event.event_type)

    // No agents registered - complete successfully
    if (agents.length === 0) {
      console.log(`[Processor] No agents registered for event type: ${event.event_type}`)
      await this.markEventCompleted(event.id)
      return
    }

    console.log(`[Processor] Found ${agents.length} agent(s) for event type: ${event.event_type}`)

    const allEmittedEvents: EmittedEvent[] = []
    const errors: string[] = []

    // Execute each agent with try/catch
    for (const agent of agents) {
      try {
        console.log(`[Processor] Executing agent: ${agent.name}`)
        const emitted = await agent.handle(event)
        allEmittedEvents.push(...emitted)
        console.log(`[Processor] Agent ${agent.name} emitted ${emitted.length} event(s)`)
      } catch (agentError) {
        const errorMessage = agentError instanceof Error ? agentError.message : String(agentError)
        console.error(`[Processor] Agent ${agent.name} threw error:`, errorMessage)
        errors.push(`${agent.name}: ${errorMessage}`)
      }
    }

    // ========================================
    // SUCCESS/FAILURE DECISION GATE
    // ========================================
    // This is the SINGLE decision point for event outcome.
    // No partial state updates occur before this point.
    // ========================================

    // Safety assertion log for production verification
    console.log('[Processor] Event execution summary', {
      event_id: event.id,
      event_type: event.event_type,
      agent_count: agents.length,
      errors_count: errors.length,
      emitted_count: allEmittedEvents.length,
      decision: errors.length > 0 ? 'FAILURE' : 'SUCCESS'
    })

    // DECISION: If ANY agent failed → trigger retry logic
    if (errors.length > 0) {
      const combinedError = errors.join('; ')
      await this.handleEventFailure(event, combinedError)
      return
    }

    // DECISION: All agents succeeded → proceed to completion
    // Insert emitted events (if any) before marking complete
    if (allEmittedEvents.length > 0) {
      try {
        await this.insertEmittedEvents(event, allEmittedEvents)
      } catch (insertError) {
        const errorMessage = insertError instanceof Error ? insertError.message : String(insertError)
        console.error(`[Processor] Failed to insert emitted events:`, errorMessage)
        await this.handleEventFailure(event, `Failed to insert emitted events: ${errorMessage}`)
        return
      }
    }

    // FINAL: All agents succeeded, all emitted events inserted
    await this.markEventCompleted(event.id)
    console.log(`[Processor] Event ${event.id} completed`)
  }

  async insertEmittedEvents(sourceEvent: EventRecord, emittedEvents: EmittedEvent[]): Promise<void> {
    const supabase = getSupabaseClient()

    const newChainDepth = (sourceEvent.chain_depth ?? 0) + 1

    // Generate DETERMINISTIC idempotency keys based on parent event
    // This ensures retries don't create duplicate child events
    const records = emittedEvents.map((e, index) => ({
      tenant_id: sourceEvent.tenant_id,
      project_id: sourceEvent.project_id,
      event_type: e.event_type,
      payload: e.payload,
      // Deterministic key: parent_idempotency_key + event_type + index
      // If parent retries, same key = no duplicate insertion
      idempotency_key: `${sourceEvent.idempotency_key}:${e.event_type}:${index}`,
      chain_depth: newChainDepth,
      status: 'pending',
      source_agent_id: null,
      // Initialize retry fields for new events
      retry_count: 0,
      max_attempts: 3,
      error: null,
      next_retry_at: null
    }))

    // Use upsert with ON CONFLICT DO NOTHING to handle retries safely
    const { data, error } = await supabase
      .from('event_store')
      .upsert(records, {
        onConflict: 'tenant_id,idempotency_key',
        ignoreDuplicates: true
      })
      .select('id, event_type')

    if (error) {
      console.error('[Processor] Error inserting emitted events:', error)
      throw error
    }

    const insertedCount = data?.length || 0
    const skippedCount = emittedEvents.length - insertedCount

    if (skippedCount > 0) {
      console.log(`[Processor] Inserted ${insertedCount} emitted event(s), skipped ${skippedCount} duplicate(s) at chain depth ${newChainDepth}`)
    } else {
      console.log(`[Processor] Inserted ${insertedCount} emitted event(s) at chain depth ${newChainDepth}`)
    }

    for (let i = 0; i < (data?.length || 0); i++) {
      const insertedEvent = data[i]
      const emittedEvent = emittedEvents.find(e => e.event_type === insertedEvent.event_type)
      const fullEvent = {
        ...insertedEvent,
        tenant_id: sourceEvent.tenant_id,
        project_id: sourceEvent.project_id,
        payload: emittedEvent?.payload || {},
        chain_depth: newChainDepth,
        status: 'pending',
        idempotency_key: `${sourceEvent.idempotency_key}:${insertedEvent.event_type}:${i}`,
        source_agent_id: null,
        processing_started_at: null,
        created_at: new Date().toISOString(),
        processed_at: null,
        // Retry fields
        retry_count: 0,
        max_attempts: 3,
        error: null,
        next_retry_at: null
      } as EventRecord

      try {
        await runProjections(fullEvent)
        console.log(`[Processor] Projection executed for: ${insertedEvent.event_type}`)
      } catch (projError) {
        console.error(`[Processor] Projection error for ${insertedEvent.event_type}:`, projError)
      }
    }
  }

  async markEventCompleted(eventId: string): Promise<void> {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('event_store')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        error: null // Clear any previous error on success
      })
      .eq('id', eventId)

    if (error) {
      console.error('[Processor] Error marking event completed:', error)
      throw error
    }
  }

  /**
   * Handle event failure with retry logic
   * - If retries remaining: schedule next retry with exponential backoff
   * - If max attempts reached: mark as permanently failed
   */
  async handleEventFailure(event: EventRecord, errorMessage: string): Promise<void> {
    const currentRetryCount = event.retry_count ?? 0
    const maxAttempts = event.max_attempts ?? 3
    const nextRetryCount = currentRetryCount + 1

    if (nextRetryCount < maxAttempts) {
      // Schedule retry with exponential backoff: 2^retry_count seconds
      // Retry 1: 2s, Retry 2: 4s, Retry 3: 8s, etc.
      const backoffSeconds = Math.pow(2, nextRetryCount)
      const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString()

      await this.scheduleRetry(event.id, nextRetryCount, errorMessage, nextRetryAt)

      console.log(`[Processor] ⏳ Event ${event.id} scheduled for retry ${nextRetryCount}/${maxAttempts} in ${backoffSeconds}s`)
      console.log(`[Processor]    Next retry at: ${nextRetryAt}`)
      console.log(`[Processor]    Error: ${errorMessage}`)
    } else {
      // Max attempts reached - permanently fail
      await this.markEventPermanentlyFailed(event, errorMessage)
    }
  }

  /**
   * Schedule a retry for a failed event
   */
  async scheduleRetry(
    eventId: string,
    retryCount: number,
    errorMessage: string,
    nextRetryAt: string
  ): Promise<void> {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('event_store')
      .update({
        status: 'pending',
        retry_count: retryCount,
        error: errorMessage,
        next_retry_at: nextRetryAt,
        processing_started_at: null // Clear processing timestamp
      })
      .eq('id', eventId)

    if (error) {
      console.error('[Processor] Error scheduling retry:', error)
      throw error
    }
  }

  /**
   * Mark event as permanently failed (no more retries)
   */
  async markEventPermanentlyFailed(event: EventRecord, errorMessage: string): Promise<void> {
    const supabase = getSupabaseClient()
    const currentRetryCount = event.retry_count ?? 0
    const maxAttempts = event.max_attempts ?? 3

    console.log(`[Processor] ❌ Event ${event.id} PERMANENTLY FAILED after ${currentRetryCount + 1} attempt(s)`)
    console.log(`[Processor]    Event type: ${event.event_type}`)
    console.log(`[Processor]    Error: ${errorMessage}`)

    const { error } = await supabase
      .from('event_store')
      .update({
        status: 'failed',
        retry_count: currentRetryCount + 1,
        error: errorMessage,
        processed_at: new Date().toISOString(),
        next_retry_at: null // Clear retry timestamp
      })
      .eq('id', event.id)

    if (error) {
      console.error('[Processor] Error marking event permanently failed:', error)
      throw error
    }
  }
}
