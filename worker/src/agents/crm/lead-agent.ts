import type { Agent, EventRecord, EmittedEvent } from '../../types'

export class CrmLeadAgent implements Agent {
  name = 'CrmLeadAgent'

  subscribe(): string[] {
    return ['lead.created']
  }

  async handle(event: EventRecord): Promise<EmittedEvent[]> {
    const payload = event.payload as { email?: string; name?: string; company?: string }

    if (!payload.email) {
      console.log(`[${this.name}] Skipping event ${event.id}: missing email in payload`)
      return []
    }

    console.log(`[${this.name}] Processing lead: ${payload.email}`)

    return [
      {
        event_type: 'lead.persist',
        payload: {
          email: payload.email,
          name: payload.name || null,
          company: payload.company || null,
          source_event_id: event.id
        }
      }
    ]
  }
}
