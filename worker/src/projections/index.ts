import type { EventRecord } from '../types'
import { runLeadProjection } from './lead-projection'
import { runEmailProjection } from './email-projection'

export async function runProjections(event: EventRecord): Promise<void> {
  console.log(`[Projections] Running projections for event: ${event.event_type}`)

  await runLeadProjection(event)
  await runEmailProjection(event)
}
