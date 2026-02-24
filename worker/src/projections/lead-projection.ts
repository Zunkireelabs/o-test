import { getSupabaseClient } from '../db'
import type { EventRecord } from '../types'

export async function runLeadProjection(event: EventRecord): Promise<void> {
  if (event.event_type !== 'lead.persist') {
    return
  }

  const payload = event.payload as {
    email?: string
    name?: string | null
    company?: string | null
    source_event_id?: string
  }

  if (!payload.email) {
    console.log(`[LeadProjection] Skipping: missing email`)
    return
  }

  const supabase = getSupabaseClient()

  // Use raw SQL for proper ON CONFLICT upsert
  const { data, error } = await supabase.rpc('upsert_lead', {
    p_tenant_id: event.tenant_id,
    p_project_id: event.project_id,
    p_email: payload.email,
    p_name: payload.name || null,
    p_company: payload.company || null,
    p_metadata: payload,
    p_event_id: event.id
  })

  if (error) {
    // Fallback: RPC function doesn't exist, use manual upsert
    if (error.code === 'PGRST202') {
      await manualUpsert(event, payload)
      return
    }
    console.error(`[LeadProjection] Error upserting lead:`, error)
    throw error
  }

  console.log(`[LeadProjection] Upserted lead: ${payload.email}`)
}

async function manualUpsert(
  event: EventRecord,
  payload: { email?: string; name?: string | null; company?: string | null }
): Promise<void> {
  const supabase = getSupabaseClient()

  // Check if lead exists
  const { data: existing, error: selectError } = await supabase
    .from('leads')
    .select('id')
    .eq('tenant_id', event.tenant_id)
    .eq('email', payload.email!)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    console.error(`[LeadProjection] Error checking existing lead:`, selectError)
    throw selectError
  }

  if (existing) {
    // UPDATE
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        name: payload.name || undefined,
        company: payload.company || undefined,
        metadata: payload,
        event_id: event.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error(`[LeadProjection] Error updating lead:`, updateError)
      throw updateError
    }

    console.log(`[LeadProjection] Updated lead: ${payload.email} (id: ${existing.id})`)
  } else {
    // INSERT
    const { data: inserted, error: insertError } = await supabase
      .from('leads')
      .insert({
        tenant_id: event.tenant_id,
        project_id: event.project_id,
        email: payload.email!,
        name: payload.name || null,
        company: payload.company || null,
        metadata: payload,
        status: 'new',
        event_id: event.id
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`[LeadProjection] Error inserting lead:`, insertError)
      throw insertError
    }

    console.log(`[LeadProjection] Created lead: ${payload.email} (id: ${inserted.id})`)
  }
}
