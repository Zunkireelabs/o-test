import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { eventInsertSchema } from '@/lib/events/schemas'
import { verifySignature } from '@/lib/events/hmac'
import type { IngestResponse, IngestErrorResponse } from '@/types/events'
import type { Json } from '@/types/database'

// Maximum allowed timestamp drift (5 minutes in milliseconds)
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000

/**
 * POST /api/events/ingest
 *
 * Security-critical event ingestion endpoint.
 * Validates HMAC signature, schema, and inserts event into event_store.
 *
 * Does NOT:
 * - Execute agents
 * - Call workers
 * - Write to leads or other tables
 * - Mutate any state beyond event_store
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<IngestResponse | IngestErrorResponse>> {
  try {
    // 1️⃣ Extract headers
    const tenantId = request.headers.get('x-orca-tenant-id')
    const projectId = request.headers.get('x-orca-project-id')
    const signature = request.headers.get('x-orca-signature')
    const timestamp = request.headers.get('x-orca-timestamp')

    // Validate required headers
    if (!tenantId || !signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 401 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing project ID header' },
        { status: 400 }
      )
    }

    // 2️⃣ Validate timestamp (within ±5 minutes)
    const timestampMs = parseInt(timestamp, 10)
    if (isNaN(timestampMs)) {
      return NextResponse.json(
        { error: 'Invalid timestamp format' },
        { status: 400 }
      )
    }

    const now = Date.now()
    const drift = Math.abs(now - timestampMs)
    if (drift > MAX_TIMESTAMP_DRIFT_MS) {
      return NextResponse.json(
        { error: 'Timestamp outside acceptable range' },
        { status: 400 }
      )
    }

    // Read raw body for signature verification
    const rawBody = await request.text()

    // 3️⃣ Fetch tenant by ID
    const supabase = createAdminClient()

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, hmac_secret')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      )
    }

    // 4️⃣ Verify HMAC signature
    const isValidSignature = verifySignature(
      rawBody,
      timestamp,
      signature,
      tenant.hmac_secret
    )

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // 5️⃣ Parse JSON body
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // 6️⃣ Validate schema using Zod
    const parseResult = eventInsertSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid event schema' },
        { status: 400 }
      )
    }

    const { event_type, idempotency_key, payload } = parseResult.data

    // 7️⃣ Validate project_id belongs to tenant
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid project' },
        { status: 400 }
      )
    }

    const validatedProjectId = project.id

    // 8️⃣ Insert into event_store
    const { data: insertedEvent, error: insertError } = await supabase
      .from('event_store')
      .insert({
        tenant_id: tenantId,
        project_id: validatedProjectId,
        event_type,
        payload: payload as Json,
        idempotency_key,
        status: 'pending',
        chain_depth: 0
      })
      .select('id')
      .single()

    // 9️⃣ Handle duplicate (unique violation on tenant_id, idempotency_key)
    if (insertError) {
      // Check if it's a unique constraint violation (code 23505)
      if (insertError.code === '23505') {
        // Fetch existing event
        const { data: existingEvent } = await supabase
          .from('event_store')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('idempotency_key', idempotency_key)
          .single()

        if (existingEvent) {
          return NextResponse.json(
            {
              event_id: existingEvent.id,
              status: 'duplicate'
            },
            { status: 200 }
          )
        }
      }

      // Other database errors
      console.error('Event insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to process event' },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json(
      {
        event_id: insertedEvent.id,
        status: 'accepted'
      },
      { status: 200 }
    )
  } catch (error) {
    // Log error but don't leak details
    console.error('Event ingestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
