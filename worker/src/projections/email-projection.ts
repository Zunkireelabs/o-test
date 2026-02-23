import { getSupabaseClient } from '../db'
import type { EventRecord } from '../types'

export async function runEmailProjection(event: EventRecord): Promise<void> {
  if (event.event_type !== 'email.sent') {
    return
  }

  const payload = event.payload as {
    email?: string
    subject?: string
    status?: string
    lead_id?: string
  }

  if (!payload.email) {
    console.log(`[EmailProjection] Skipping: missing email`)
    return
  }

  if (!payload.subject) {
    console.log(`[EmailProjection] Skipping: missing subject`)
    return
  }

  if (!payload.status) {
    console.log(`[EmailProjection] Skipping: missing status`)
    return
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('email_logs')
    .insert({
      tenant_id: event.tenant_id,
      project_id: event.project_id,
      lead_id: payload.lead_id || null,
      email: payload.email,
      subject: payload.subject,
      status: payload.status,
      event_id: event.id,
      sent_at: new Date().toISOString()
    })

  if (error) {
    console.error(`[EmailProjection] Error inserting email log:`, error)
    throw error
  }

  console.log(`[EmailProjection] Logged email to: ${payload.email}`)
}
