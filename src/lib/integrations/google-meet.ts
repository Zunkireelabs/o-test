import { createAdminClient } from '@/lib/supabase/server';
import { refreshGoogleToken } from './gmail';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface MeetingResult {
  meetLink: string;
  eventId: string;
  startTime: string;
  endTime: string;
}

interface MeetingListItem {
  eventId: string;
  title: string;
  meetLink: string;
  startTime: string;
  endTime: string;
  attendees: string[];
}

interface MeetingDetails {
  eventId: string;
  title: string;
  meetLink: string | null;
  startTime: string;
  endTime: string;
  description: string | null;
  attendees: string[];
  status: string;
}

/**
 * Create a Google Meet meeting via the Calendar API.
 * If no startTime is given, defaults to now + 5 minutes.
 * Default duration is 30 minutes.
 */
export async function createMeeting(
  accessToken: string,
  title: string,
  startTime?: string,
  durationMinutes: number = 30
): Promise<{ success: boolean; meeting?: MeetingResult; error?: string }> {
  const start = startTime ? new Date(startTime) : new Date(Date.now() + 5 * 60 * 1000);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const requestId = crypto.randomUUID();

  const body = {
    summary: title,
    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Meet create failed:', errorText);
    return { success: false, error: `Calendar API error: ${response.status}` };
  }

  const data = await response.json();
  const meetLink = data.conferenceData?.entryPoints?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep: any) => ep.entryPointType === 'video'
  )?.uri;

  return {
    success: true,
    meeting: {
      meetLink: meetLink || '',
      eventId: data.id,
      startTime: data.start?.dateTime || start.toISOString(),
      endTime: data.end?.dateTime || end.toISOString(),
    },
  };
}

/**
 * List upcoming meetings that have a Google Meet link.
 */
export async function listUpcomingMeetings(
  accessToken: string,
  maxResults: number = 5
): Promise<{ success: boolean; meetings?: MeetingListItem[]; error?: string }> {
  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin,
    maxResults: String(maxResults * 3), // fetch extra since we filter for Meet events
    orderBy: 'startTime',
    singleEvents: 'true',
    conferenceDataVersion: '1',
  });

  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Meet list failed:', errorText);
    return { success: false, error: `Calendar API error: ${response.status}` };
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items || []) as any[];

  const meetings: MeetingListItem[] = items
    .filter(
      (event) =>
        event.conferenceData?.conferenceSolution?.name === 'Google Meet'
    )
    .slice(0, maxResults)
    .map((event) => ({
      eventId: event.id,
      title: event.summary || '(No title)',
      meetLink:
        event.conferenceData?.entryPoints?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ep: any) => ep.entryPointType === 'video'
        )?.uri || '',
      startTime: event.start?.dateTime || event.start?.date || '',
      endTime: event.end?.dateTime || event.end?.date || '',
      attendees: (event.attendees || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.email as string
      ),
    }));

  return { success: true, meetings };
}

/**
 * Get details for a specific calendar event (meeting).
 */
export async function getMeetingDetails(
  accessToken: string,
  eventId: string
): Promise<{ success: boolean; meeting?: MeetingDetails; error?: string }> {
  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Meet details failed:', errorText);
    return { success: false, error: `Calendar API error: ${response.status}` };
  }

  const event = await response.json();
  const meetLink =
    event.conferenceData?.entryPoints?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ep: any) => ep.entryPointType === 'video'
    )?.uri || null;

  return {
    success: true,
    meeting: {
      eventId: event.id,
      title: event.summary || '(No title)',
      meetLink,
      startTime: event.start?.dateTime || event.start?.date || '',
      endTime: event.end?.dateTime || event.end?.date || '',
      description: event.description || null,
      attendees: (event.attendees || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.email as string
      ),
      status: event.status || 'confirmed',
    },
  };
}

/**
 * Get a valid Google access token for the user's Google Meet integration.
 * Fetches the google_meet integration from DB, refreshes if expired.
 */
export async function getGoogleMeetCredentials(
  userId: string
): Promise<{ accessToken: string; integrationId: string } | null> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: integration } = await (admin.from('integrations') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_meet')
    .eq('status', 'connected')
    .maybeSingle();

  if (!integration) return null;

  const credentials = integration.credentials as {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
  };

  // Check if token is expired (with 5-minute buffer)
  const isExpired =
    credentials.expires_at &&
    new Date(credentials.expires_at).getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && credentials.refresh_token) {
    const newToken = await refreshGoogleToken(
      credentials.refresh_token,
      userId,
      integration.id
    );
    return { accessToken: newToken, integrationId: integration.id };
  }

  return { accessToken: credentials.access_token, integrationId: integration.id };
}
