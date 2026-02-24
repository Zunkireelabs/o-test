import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateSessionRequest {
  tenant_id: string
  project_id: string
  title: string
}

interface ChatSession {
  id: string
  tenant_id: string
  project_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSessionRequest = await req.json()
    const { tenant_id, project_id, title } = body

    if (!tenant_id || !project_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, project_id, title' },
        { status: 400 }
      )
    }

    // Validate user membership in tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not a member of this tenant' },
        { status: 403 }
      )
    }

    // Validate project belongs to tenant
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to tenant' },
        { status: 400 }
      )
    }

    // Create chat session
    const { data: session, error: insertError } = await supabase
      .from('chat_sessions')
      .insert({
        tenant_id,
        project_id,
        user_id: user.id,
        title,
      })
      .select('id, tenant_id, project_id, user_id, title, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('Failed to create chat session:', insertError)
      return NextResponse.json(
        { error: 'Failed to create chat session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: session.id,
      session,
    })
  } catch (error) {
    console.error('Chat sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat/sessions
 * List chat sessions for a tenant/project
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenant_id = searchParams.get('tenant_id')
    const project_id = searchParams.get('project_id')

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: tenant_id' },
        { status: 400 }
      )
    }

    // Validate user membership in tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not a member of this tenant' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('chat_sessions')
      .select('id, tenant_id, project_id, user_id, title, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false })

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data: sessions, error: selectError } = await query

    if (selectError) {
      console.error('Failed to fetch chat sessions:', selectError)
      return NextResponse.json(
        { error: 'Failed to fetch chat sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: sessions as ChatSession[] })
  } catch (error) {
    console.error('Chat sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
