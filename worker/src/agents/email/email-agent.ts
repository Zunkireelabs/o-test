import type { Agent, EventRecord, EmittedEvent } from '../../types'
import { getSupabaseClient } from '../../db'

export class EmailBroadcastAgent implements Agent {
  name = 'EmailBroadcastAgent'

  subscribe(): string[] {
    return ['email.broadcast_requested']
  }

  async handle(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as {
      subject?: string
      body?: string
      status?: string
    }

    if (!payload.subject || !payload.body) {
      console.log(`[${this.name}] Skipping event ${event.id}: missing subject or body`)
      return []
    }

    const supabase = getSupabaseClient()

    // Build query with tenant isolation
    let query = supabase
      .from('leads')
      .select('id, email, name, status')
      .eq('tenant_id', event.tenant_id)
      .eq('project_id', event.project_id)

    // Apply optional status filter
    if (payload.status) {
      query = query.eq('status', payload.status)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error(`[${this.name}] Error querying leads:`, error)
      return []
    }

    if (!leads || leads.length === 0) {
      console.log(`[${this.name}] No leads found for broadcast`)
      return []
    }

    console.log(`[${this.name}] Broadcasting to ${leads.length} lead(s)`)

    const emittedEvents: EmittedEvent[] = []

    for (const lead of leads) {
      // Simulate sending email
      console.log(`[${this.name}] Sending email to ${lead.email}`)

      emittedEvents.push({
        event_type: 'email.sent',
        payload: {
          email: lead.email,
          subject: payload.subject,
          status: 'sent'
        }
      })
    }

    return emittedEvents
  }
}
