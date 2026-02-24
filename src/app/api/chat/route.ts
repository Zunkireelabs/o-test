import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getGmailCredentials, sendGmailEmail } from '@/lib/integrations/gmail';
import { getGoogleMeetCredentials, createMeeting, listUpcomingMeetings, getMeetingDetails } from '@/lib/integrations/google-meet';
import { searchPlaces, getDirections, getPlaceDetails } from '@/lib/integrations/google-maps';
import { webSearch, browseUrl } from '@/lib/integrations/web-browse';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const SYSTEM_PROMPT = `You are Orca, an intelligent AI assistant embedded in the Orca orchestration platform. You help users manage their knowledge bases, data pipelines, integrations, and agentic workflows. Be concise, helpful, and friendly.

You must emit internal business actions using the emit_event tool.
Do not assume state changes are immediate.
Do not directly modify database state.

You have access to internal tools for querying business data.
If a user asks about leads, you MUST use query_leads tool instead of asking where data is stored.

When a user asks to send, broadcast, notify, or email leads:
You MUST emit an internal domain event using the emit_event tool.
Use event_type: "email.broadcast_requested"
Payload must include:
- subject (string)
- body (string)
Do NOT directly send emails.
All email operations must go through event emission.`;

const SEND_EMAIL_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'send_email',
    description: 'Send an email via the user\'s connected Gmail account',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body text' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
};

const CREATE_MEETING_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_meeting',
    description: 'Create a Google Meet video conference meeting',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Meeting title' },
        start_time: { type: 'string', description: 'Start time as ISO 8601 string (optional, defaults to now + 5 min)' },
        duration_minutes: { type: 'number', description: 'Duration in minutes (optional, defaults to 30)' },
      },
      required: ['title'],
    },
  },
};

const LIST_MEETINGS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'list_upcoming_meetings',
    description: 'List upcoming Google Meet meetings from the user\'s calendar',
    parameters: {
      type: 'object',
      properties: {
        max_results: { type: 'number', description: 'Maximum number of meetings to return (optional, defaults to 5)' },
      },
    },
  },
};

const GET_MEETING_DETAILS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_meeting_details',
    description: 'Get details of a specific Google Meet meeting by event ID',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The calendar event ID' },
      },
      required: ['event_id'],
    },
  },
};

const SEARCH_PLACES_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_places',
    description: 'Search for places, businesses, or points of interest on the map',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query — ALWAYS include city and country for accuracy (e.g., "coffee shops near Thamel, Kathmandu, Nepal" or "hotels in San Francisco, USA")' },
        max_results: { type: 'number', description: 'Maximum number of results to return (optional, defaults to 5)' },
      },
      required: ['query'],
    },
  },
};

const GET_DIRECTIONS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_directions',
    description: 'Get directions and travel information between two locations',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Starting address or location — include city and country for accuracy' },
        destination: { type: 'string', description: 'Destination address or location — include city and country for accuracy' },
        travel_mode: { type: 'string', description: 'Travel mode: DRIVE, WALK, BICYCLE, or TRANSIT (optional, defaults to DRIVE)' },
      },
      required: ['origin', 'destination'],
    },
  },
};

const GET_PLACE_DETAILS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_place_details',
    description: 'Get detailed information about a specific place by its place ID (from search results)',
    parameters: {
      type: 'object',
      properties: {
        place_id: { type: 'string', description: 'The place ID from search results' },
      },
      required: ['place_id'],
    },
  },
};

const WEB_SEARCH_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for information using DuckDuckGo',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Maximum number of results (optional, defaults to 5)' },
      },
      required: ['query'],
    },
  },
};

const BROWSE_URL_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'browse_url',
    description: 'Read the content of a web page at the given URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to read' },
      },
      required: ['url'],
    },
  },
};

const EMIT_EVENT_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'emit_event',
    description: 'Emit internal Orca domain event',
    parameters: {
      type: 'object',
      properties: {
        event_type: { type: 'string', description: 'Event type in format domain.action (e.g., lead.created, workflow.triggered)' },
        payload: { type: 'object', description: 'Event payload data' },
      },
      required: ['event_type', 'payload'],
    },
  },
};

const QUERY_LEADS_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'query_leads',
    description: 'Query leads from the database with optional filters. Use this to retrieve lead information.',
    parameters: {
      type: 'object',
      properties: {
        created_today: { type: 'boolean', description: 'Filter to only leads created today (UTC)' },
        city: { type: 'string', description: 'Filter by city name' },
        status: { type: 'string', description: 'Filter by lead status' },
        limit: { type: 'number', description: 'Maximum number of leads to return (default 20)' },
      },
    },
  },
};

interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_calls: unknown | null
  created_at: string
}

interface ChatRequest {
  message: string
  tenant_id: string
  project_id: string
  session_id: string
}

export async function POST(req: NextRequest) {
  console.log('[CHAT ROUTE HIT]');
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await req.json();

    // Validate required fields
    if (!body.session_id || !body.tenant_id || !body.project_id) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, tenant_id, project_id' },
        { status: 400 }
      );
    }

    return handleSessionChat(supabase, user.id, body);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSessionChat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  body: ChatRequest
) {
  const { message, tenant_id, project_id, session_id } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // 1. Validate user membership in tenant
  const { data: membership, error: membershipError } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: 'User is not a member of this tenant' },
      { status: 403 }
    );
  }

  // 2. Validate session belongs to tenant + project
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, tenant_id, project_id')
    .eq('id', session_id)
    .eq('tenant_id', tenant_id)
    .eq('project_id', project_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Session not found or does not belong to tenant/project' },
      { status: 400 }
    );
  }

  // 3. Load previous messages for session ordered by created_at
  const { data: previousMessages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('id, role, content, tool_calls, created_at')
    .eq('session_id', session_id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Failed to load chat history:', messagesError);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }

  // 4. Insert current user message
  const { error: userMsgError } = await supabase
    .from('chat_messages')
    .insert({
      session_id,
      role: 'user',
      content: message,
    });

  if (userMsgError) {
    console.error('Failed to save user message:', userMsgError);
    return NextResponse.json(
      { error: 'Failed to save user message' },
      { status: 500 }
    );
  }

  // Check which integrations the user has connected
  const { data: integrations } = await supabase
    .from('integrations')
    .select('provider')
    .eq('user_id', userId)
    .eq('status', 'connected');

  const connectedProviders = ((integrations ?? []) as Array<{ provider: string }>).map(i => i.provider);
  const hasGmail = connectedProviders.includes('gmail');
  const hasGoogleMeet = connectedProviders.includes('google_meet');

  // Build tools array based on connected integrations
  const tools: ChatCompletionTool[] = [];
  // Email is handled via event-driven flow (email.broadcast_requested)
  // SEND_EMAIL_TOOL is intentionally NOT exposed to GPT
  if (hasGoogleMeet) {
    tools.push(CREATE_MEETING_TOOL, LIST_MEETINGS_TOOL, GET_MEETING_DETAILS_TOOL);
  }
  tools.push(SEARCH_PLACES_TOOL, GET_DIRECTIONS_TOOL, GET_PLACE_DETAILS_TOOL);
  tools.push(WEB_SEARCH_TOOL, BROWSE_URL_TOOL);
  // Always include internal tools
  tools.push(EMIT_EVENT_TOOL);
  tools.push(QUERY_LEADS_TOOL);

  // Build system prompt with tool awareness
  let systemPrompt = SYSTEM_PROMPT;
  if (hasGmail) {
    systemPrompt += '\n\nThe user has Gmail connected. Email delivery will be handled asynchronously by the Orca event engine.';
  }
  if (hasGoogleMeet) {
    systemPrompt += '\n\nThe user has Google Meet connected. You can create meetings, list upcoming meetings, and get meeting details.';
  }
  systemPrompt += '\n\nYou can search for places, get directions, and get detailed place information. You can also search the web and read web pages.';

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Build OpenAI messages from history + current message
  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add previous messages
  for (const msg of (previousMessages || []) as ChatMessage[]) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
    // Note: tool messages would need special handling if we want to replay tool calls
  }

  // Add current user message
  openaiMessages.push({ role: 'user', content: message });

  // Detect email intent to force emit_event tool
  const emailIntent = /send|broadcast|email|notify/i.test(message);

  console.log('[OPENAI REQUEST START]', { emailIntent });

  // 5. Call OpenAI with full conversation
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: openaiMessages,
    ...(tools.length > 0 ? { tools } : {}),
    tool_choice: emailIntent
      ? { type: 'function', function: { name: 'emit_event' } }
      : 'auto',
  });

  const encoder = new TextEncoder();
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
  let hasToolCall = false;
  let textContent = '';
  let finishReason: string | null = null;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          console.log('STREAM CHUNK:', JSON.stringify(chunk));
          const choice = chunk.choices[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Capture finish_reason from final chunk
          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }

          if (delta.content) {
            textContent += delta.content;
            // Only stream immediately for non-email intents
            if (!emailIntent) {
              controller.enqueue(encoder.encode(delta.content));
            }
          }

          if (delta.tool_calls) {
            hasToolCall = true;
            for (const tc of delta.tool_calls) {
              if (tc.index !== undefined) {
                while (toolCalls.length <= tc.index) {
                  toolCalls.push({ id: '', name: '', arguments: '' });
                }
                if (tc.id) toolCalls[tc.index].id = tc.id;
                if (tc.function?.name) toolCalls[tc.index].name = tc.function.name;
                if (tc.function?.arguments) toolCalls[tc.index].arguments += tc.function.arguments;
              }
            }
          }
        }

        // Validate email intent received tool_calls
        if (emailIntent && finishReason !== 'tool_calls') {
          console.error('[STREAM ERROR] Forced emit_event but model did not return tool_calls', {
            finishReason,
            hasToolCall,
            textContent: textContent.substring(0, 100),
          });
          controller.enqueue(encoder.encode('\n\n[Error: Failed to process email request. Please try again.]'));
          controller.close();
          return;
        }

        if (!hasToolCall) {
          // 6. Persist assistant response
          await supabase
            .from('chat_messages')
            .insert({
              session_id,
              role: 'assistant',
              content: textContent,
            });

          controller.close();
          return;
        }

        // Execute tool calls
        const toolResults: ChatCompletionMessageParam[] = [];

        const assistantToolMsg: ChatCompletionMessageParam = {
          role: 'assistant',
          content: textContent || null,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        };

        // 6a. Persist assistant message with tool_calls IMMEDIATELY (before execution)
        await supabase
          .from('chat_messages')
          .insert({
            session_id,
            role: 'assistant',
            content: textContent || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.name,
                arguments: tc.arguments,
              },
            })),
          });

        // 6b. Execute each tool and persist results immediately
        for (const tc of toolCalls) {
          let result: string;

          if (tc.name === 'send_email') {
            result = await executeSendEmail(userId, tc.arguments);
          } else if (tc.name === 'create_meeting') {
            result = await executeCreateMeeting(userId, tc.arguments);
          } else if (tc.name === 'list_upcoming_meetings') {
            result = await executeListMeetings(userId, tc.arguments);
          } else if (tc.name === 'get_meeting_details') {
            result = await executeGetMeetingDetails(userId, tc.arguments);
          } else if (tc.name === 'search_places') {
            result = await executeSearchPlaces(userId, tc.arguments);
          } else if (tc.name === 'get_directions') {
            result = await executeGetDirections(userId, tc.arguments);
          } else if (tc.name === 'get_place_details') {
            result = await executeGetPlaceDetails(userId, tc.arguments);
          } else if (tc.name === 'web_search') {
            result = await executeWebSearch(tc.arguments);
          } else if (tc.name === 'browse_url') {
            result = await executeBrowseUrl(tc.arguments);
          } else if (tc.name === 'emit_event') {
            result = await executeEmitEvent(supabase, tenant_id, project_id, tc.arguments);
          } else if (tc.name === 'query_leads') {
            result = await executeQueryLeads(supabase, tenant_id, project_id, tc.arguments);
          } else {
            result = JSON.stringify({ error: `Unknown tool: ${tc.name}` });
          }

          // Persist tool result immediately after execution
          await supabase
            .from('chat_messages')
            .insert({
              session_id,
              role: 'tool',
              content: result,
              tool_calls: { tool_call_id: tc.id },
            });

          toolResults.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });
        }

        // Follow-up streaming call with tool results
        const followUpMessages: ChatCompletionMessageParam[] = [
          ...openaiMessages,
          assistantToolMsg,
          ...toolResults,
        ];

        const followUpStream = await openai.chat.completions.create({
          model: 'gpt-4o',
          stream: true,
          messages: followUpMessages,
        });

        let followUpContent = '';
        for await (const chunk of followUpStream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            followUpContent += content;
            controller.enqueue(encoder.encode(content));
          }
        }

        // 6c. Persist final assistant response (no tool_calls)
        await supabase
          .from('chat_messages')
          .insert({
            session_id,
            role: 'assistant',
            content: followUpContent,
          });

        controller.close();
      } catch (err) {
        console.error('Stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function executeSendEmail(userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { to, subject, body } = args;

    if (!to || !subject || !body) {
      return JSON.stringify({ error: 'Missing required fields: to, subject, body' });
    }

    const gmailCreds = await getGmailCredentials(userId);
    if (!gmailCreds) {
      return JSON.stringify({ error: 'Gmail is not connected. Please connect Gmail in the Integrations page first.' });
    }

    const result = await sendGmailEmail(gmailCreds.accessToken, to, subject, body);
    return JSON.stringify(result);
  } catch (err) {
    console.error('send_email tool error:', err);
    return JSON.stringify({ error: 'Failed to send email' });
  }
}

async function executeCreateMeeting(userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { title, start_time, duration_minutes } = args;

    if (!title) {
      return JSON.stringify({ error: 'Missing required field: title' });
    }

    const creds = await getGoogleMeetCredentials(userId);
    if (!creds) {
      return JSON.stringify({ error: 'Google Meet is not connected. Please connect Google Meet in the Integrations page first.' });
    }

    const result = await createMeeting(creds.accessToken, title, start_time, duration_minutes);
    return JSON.stringify(result);
  } catch (err) {
    console.error('create_meeting tool error:', err);
    return JSON.stringify({ error: 'Failed to create meeting' });
  }
}

async function executeListMeetings(userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { max_results } = args;

    const creds = await getGoogleMeetCredentials(userId);
    if (!creds) {
      return JSON.stringify({ error: 'Google Meet is not connected. Please connect Google Meet in the Integrations page first.' });
    }

    const result = await listUpcomingMeetings(creds.accessToken, max_results);
    return JSON.stringify(result);
  } catch (err) {
    console.error('list_upcoming_meetings tool error:', err);
    return JSON.stringify({ error: 'Failed to list meetings' });
  }
}

async function executeGetMeetingDetails(userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { event_id } = args;

    if (!event_id) {
      return JSON.stringify({ error: 'Missing required field: event_id' });
    }

    const creds = await getGoogleMeetCredentials(userId);
    if (!creds) {
      return JSON.stringify({ error: 'Google Meet is not connected. Please connect Google Meet in the Integrations page first.' });
    }

    const result = await getMeetingDetails(creds.accessToken, event_id);
    return JSON.stringify(result);
  } catch (err) {
    console.error('get_meeting_details tool error:', err);
    return JSON.stringify({ error: 'Failed to get meeting details' });
  }
}

async function executeSearchPlaces(_userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { query, max_results } = args;

    if (!query) {
      return JSON.stringify({ error: 'Missing required field: query' });
    }

    const result = await searchPlaces(query, max_results);
    return JSON.stringify(result);
  } catch (err) {
    console.error('search_places tool error:', err);
    return JSON.stringify({ error: 'Failed to search places' });
  }
}

async function executeGetDirections(_userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { origin, destination, travel_mode } = args;

    if (!origin || !destination) {
      return JSON.stringify({ error: 'Missing required fields: origin, destination' });
    }

    const result = await getDirections(origin, destination, travel_mode);
    return JSON.stringify(result);
  } catch (err) {
    console.error('get_directions tool error:', err);
    return JSON.stringify({ error: 'Failed to get directions' });
  }
}

async function executeGetPlaceDetails(_userId: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { place_id } = args;

    if (!place_id) {
      return JSON.stringify({ error: 'Missing required field: place_id' });
    }

    const result = await getPlaceDetails(place_id);
    return JSON.stringify(result);
  } catch (err) {
    console.error('get_place_details tool error:', err);
    return JSON.stringify({ error: 'Failed to get place details' });
  }
}

async function executeWebSearch(argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { query, max_results } = args;

    if (!query) {
      return JSON.stringify({ error: 'Missing required field: query' });
    }

    const result = await webSearch(query, max_results);
    return JSON.stringify(result);
  } catch (err) {
    console.error('web_search tool error:', err);
    return JSON.stringify({ error: 'Failed to search the web' });
  }
}

async function executeBrowseUrl(argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { url } = args;

    if (!url) {
      return JSON.stringify({ error: 'Missing required field: url' });
    }

    const result = await browseUrl(url);
    return JSON.stringify(result);
  } catch (err) {
    console.error('browse_url tool error:', err);
    return JSON.stringify({ error: 'Failed to browse URL' });
  }
}

async function executeEmitEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenant_id: string,
  project_id: string,
  argsJson: string
): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { event_type, payload } = args;

    if (!event_type || !payload) {
      console.error('[emit_event] Validation failed:', { event_type, payload });
      return JSON.stringify({ error: 'Missing required fields: event_type, payload' });
    }

    // Validate event_type format: domain.action (e.g., lead.created, workflow.triggered)
    const eventTypeRegex = /^[a-z]+\.[a-z_]+$/;
    if (!eventTypeRegex.test(event_type)) {
      console.error('[emit_event] Validation failed:', { event_type, payload });
      return JSON.stringify({
        error: 'Invalid event_type format. Must match pattern: domain.action (e.g., lead.created, workflow.triggered)'
      });
    }

    console.log('[emit_event] Inserting event:', { event_type, tenant_id, project_id });

    // Insert into event_store
    const { error: insertError } = await supabase
      .from('event_store')
      .insert({
        tenant_id,
        project_id,
        event_type,
        payload,
        status: 'pending',
        idempotency_key: crypto.randomUUID(),
        chain_depth: 0,
      });

    if (insertError) {
      console.error('emit_event insert error:', insertError);
      return JSON.stringify({ error: 'Failed to emit event' });
    }

    // Do NOT expose event_id in the response
    return JSON.stringify({
      success: true,
      message: 'Event accepted for processing.'
    });
  } catch (err) {
    console.error('emit_event tool error:', err);
    return JSON.stringify({ error: 'Failed to emit event' });
  }
}

async function executeQueryLeads(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenant_id: string,
  project_id: string,
  argsJson: string
): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const { created_today, city, status, limit } = args;

    const queryLimit = typeof limit === 'number' && limit > 0 ? limit : 20;

    // Build query - ALWAYS filter by tenant_id and project_id
    let query = supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('project_id', project_id);

    // Filter by created_today
    if (created_today === true) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      query = query.gte('created_at', todayStart.toISOString());
    }

    // Filter by city
    if (typeof city === 'string' && city.trim()) {
      query = query.ilike('city', `%${city.trim()}%`);
    }

    // Filter by status
    if (typeof status === 'string' && status.trim()) {
      query = query.eq('status', status.trim());
    }

    // Apply limit and order
    query = query.order('created_at', { ascending: false }).limit(queryLimit);

    const { data: leads, error } = await query;

    if (error) {
      console.error('query_leads error:', error);
      return JSON.stringify({ error: 'Failed to query leads' });
    }

    return JSON.stringify({ success: true, leads: leads || [] });
  } catch (err) {
    console.error('query_leads tool error:', err);
    return JSON.stringify({ error: 'Failed to query leads' });
  }
}
