import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UpdateSessionRequest {
  title?: string
}

/**
 * PATCH /api/chat/sessions/[sessionId]
 * Update session title
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    const body: UpdateSessionRequest = await req.json()

    // Fetch session and validate ownership through tenant membership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, tenant_id, user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate user membership in tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build update object
    const updates: { title?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) {
      updates.title = body.title
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select('id, tenant_id, project_id, user_id, title, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Failed to update session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Session update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat/sessions/[sessionId]
 * Get a specific session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, tenant_id, project_id, user_id, title, created_at, updated_at')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate user membership in tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session get API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chat/sessions/[sessionId]
 * Delete a session and its messages
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    // Fetch session and validate ownership through tenant membership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, tenant_id, user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate user membership in tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', session.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete messages first (foreign key constraint)
    const { error: messagesDeleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)

    if (messagesDeleteError) {
      console.error('Failed to delete session messages:', messagesDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete session messages' },
        { status: 500 }
      )
    }

    // Delete the session
    const { error: sessionDeleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (sessionDeleteError) {
      console.error('Failed to delete session:', sessionDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
