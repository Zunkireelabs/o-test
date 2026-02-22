import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getGmailCredentials, sendGmailEmail } from '@/lib/integrations/gmail';
import { getGoogleMeetCredentials, createMeeting, listUpcomingMeetings, getMeetingDetails } from '@/lib/integrations/google-meet';
import { searchPlaces, getDirections, getPlaceDetails } from '@/lib/integrations/google-maps';
import { webSearch, browseUrl } from '@/lib/integrations/web-browse';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const SYSTEM_PROMPT = `You are Orca, an intelligent AI assistant embedded in the Orca orchestration platform. You help users manage their knowledge bases, data pipelines, integrations, and agentic workflows. Be concise, helpful, and friendly.`;

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Check which integrations the user has connected
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: integrations } = await (supabase.from('integrations') as any)
      .select('provider')
      .eq('user_id', user.id)
      .eq('status', 'connected');

    const connectedProviders = ((integrations ?? []) as Array<{ provider: string }>).map(i => i.provider);
    const hasGmail = connectedProviders.includes('gmail');
    const hasGoogleMeet = connectedProviders.includes('google_meet');

    // Build tools array based on connected integrations
    const tools: ChatCompletionTool[] = [];
    if (hasGmail) tools.push(SEND_EMAIL_TOOL);
    if (hasGoogleMeet) {
      tools.push(CREATE_MEETING_TOOL, LIST_MEETINGS_TOOL, GET_MEETING_DETAILS_TOOL);
    }
    // Maps and web tools are always available (free, no API keys)
    tools.push(SEARCH_PLACES_TOOL, GET_DIRECTIONS_TOOL, GET_PLACE_DETAILS_TOOL);
    tools.push(WEB_SEARCH_TOOL, BROWSE_URL_TOOL);

    // Build system prompt with tool awareness
    let systemPrompt = SYSTEM_PROMPT;
    if (hasGmail) {
      systemPrompt += '\n\nThe user has Gmail connected. You can send emails on their behalf using the send_email tool. When the user asks you to send an email, use the tool — do not say you cannot send emails.';
    }
    if (hasGoogleMeet) {
      systemPrompt += '\n\nThe user has Google Meet connected. You can create meetings (create_meeting), list upcoming meetings (list_upcoming_meetings), and get meeting details (get_meeting_details). When the user asks about meetings, use the appropriate tool.';
    }
    systemPrompt += '\n\nYou can search for places (search_places), get directions between locations (get_directions), and get detailed place information (get_place_details). You can also search the web (web_search) and read web pages (browse_url). When the user asks about locations, places, directions, or wants to look something up online, use the appropriate tool. IMPORTANT: When calling location tools, always include the full city and country name in the query for accurate results (e.g., "restaurants near Thamel, Kathmandu, Nepal" not just "restaurants near Thamel").';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // First streaming call
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: openaiMessages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    // We need to collect tool calls if the model wants to use a tool
    // while also streaming any text content
    const encoder = new TextEncoder();
    const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
    let hasToolCall = false;
    let textContent = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            // Stream text content immediately
            if (delta.content) {
              textContent += delta.content;
              controller.enqueue(encoder.encode(delta.content));
            }

            // Collect tool call deltas
            if (delta.tool_calls) {
              hasToolCall = true;
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  // Ensure we have a slot for this tool call
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

          // If no tool calls, we're done
          if (!hasToolCall) {
            controller.close();
            return;
          }

          // Execute tool calls and get results
          const toolResults: ChatCompletionMessageParam[] = [];

          // Add the assistant message with tool_calls to the conversation
          const assistantToolMsg: ChatCompletionMessageParam = {
            role: 'assistant',
            content: textContent || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.arguments },
            })),
          };

          for (const tc of toolCalls) {
            let result: string;

            if (tc.name === 'send_email') {
              result = await executeSendEmail(user.id, tc.arguments);
            } else if (tc.name === 'create_meeting') {
              result = await executeCreateMeeting(user.id, tc.arguments);
            } else if (tc.name === 'list_upcoming_meetings') {
              result = await executeListMeetings(user.id, tc.arguments);
            } else if (tc.name === 'get_meeting_details') {
              result = await executeGetMeetingDetails(user.id, tc.arguments);
            } else if (tc.name === 'search_places') {
              result = await executeSearchPlaces(user.id, tc.arguments);
            } else if (tc.name === 'get_directions') {
              result = await executeGetDirections(user.id, tc.arguments);
            } else if (tc.name === 'get_place_details') {
              result = await executeGetPlaceDetails(user.id, tc.arguments);
            } else if (tc.name === 'web_search') {
              result = await executeWebSearch(tc.arguments);
            } else if (tc.name === 'browse_url') {
              result = await executeBrowseUrl(tc.arguments);
            } else {
              result = JSON.stringify({ error: `Unknown tool: ${tc.name}` });
            }

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

          for await (const chunk of followUpStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }

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
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
